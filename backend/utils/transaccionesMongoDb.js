export async function checkTransactionsOn(clients) {
    for (const [index, client] of clients.entries()) {
        const status = await canUseTransactions(client);
        const {
            canUseTransactions: canTransact, // renombrado para evitar conflicto
            details: {
                setName,
                isReplicaSet,
                isWritablePrimary,
                replicaSetMembers,
                secondaries,
                msg
            },
            error
        } = status;


        console.log(`\n🔍 Cluster #${index + 1} (${setName || 'sin nombre'})`);
        console.log(`   - ${msg}`);
        console.log(`   - Replica Set: ${isReplicaSet ? '✅' : '❌'}`);
        console.log(`   - Nodo Primario: ${isWritablePrimary ? '✅' : '❌'}`);
        console.log(`   - Miembros: ${replicaSetMembers}`);
        console.log(`   - Secundarios: ${secondaries.length ? secondaries.join(', ') : 'Ninguno'}`);

        if (!canTransact) {
            console.warn(`⚠️ Transacciones no disponibles en este cluster`);
            if (error) console.warn(`   - Error: ${error}`);
        }
    }
}

async function canUseTransactions(client) {
    try {
        const adminDb = client.db().admin();
        const helloInfo = await adminDb.command({ hello: 1 });

        const isReplicaSet = !!helloInfo.setName;
        const isWritablePrimary = helloInfo.isWritablePrimary || helloInfo.ismaster;

        let replicaSetStatus = null;

        if (isReplicaSet) {
            try {
                replicaSetStatus = await adminDb.command({ replSetGetStatus: 1 });
            } catch (err) {
                replicaSetStatus = {
                    error: 'No se pudo obtener el estado del replica set',
                    details: err.message || err.toString()
                };
            }
        }

        const members = replicaSetStatus?.members || [];
        const secondaries = members.filter(m => m.stateStr === 'SECONDARY');

        return {
            canUseTransactions: isReplicaSet && isWritablePrimary,
            details: {
                isReplicaSet,
                isWritablePrimary,
                setName: helloInfo.setName || null,
                msg: isReplicaSet
                    ? '✅ Replica set detectado, puedes usar transacciones.'
                    : '❌ No es un replica set, no puedes usar transacciones.',
                replicaSetMembers: members.length,
                secondaries: secondaries.map(m => m.name),
            },
        };
    } catch (err) {
        return {
            canUseTransactions: false,
            error: err.message,
            details: { msg: '❌ Error al verificar compatibilidad con transacciones' }
        };
    }
}
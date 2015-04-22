var cluster = require('cluster');
var task = require('./lib/task');

function startWorker() {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.id);
}

if(cluster.isMaster){
    require('os').cpus().forEach(function(){
        startWorker();
    });

    cluster.on('online', function(worker) {
        if (worker.id === 1) {
            task.scheduleJob();
            task.scheduleAutoPostponeJob();
        }
    });

    // log any workers that disconnect; if a worker disconnects, it
    // should then exit, so we'll wait for the exit event to spawn
    // a new worker to replace it
    cluster.on('disconnect', function(worker){
        console.log('CLUSTER: Worker %d disconnected from the cluster.',
            worker.id);
    });

    // when a worker dies (exits), create a worker to replace it
    cluster.on('exit', function(worker, code, signal){
        console.log('CLUSTER: Worker %d died with exit code %d (%s)',
            worker.id, code, signal);
        startWorker();
    });

} else {
    // start our app on worker; see server.js
    require('./server.js')();
}

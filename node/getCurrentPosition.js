//var webModel = require('./webModel');
var spawn = require('child_process').spawn;

module.exports = function(callback) {
    runROScommand(callback, arguments[1]);
};

var runROScommand = function(callback) {
    var rawData,
        wayPointName = arguments[1],
        process = spawn('unbuffer', ['rosrun', 'tf', 'tf_echo', '/map', '/base_link']);
    process.stdout.setEncoding('utf8');
    process.stdout.on('data', function(data) {
        //console.log(data);
        if (data.indexOf('Translation') > -1) {
            rawData = data;
            process.kill();
        }
        //        if (data.indexOf('Rotation') > -1) {
        //            console.log(data);
        //            process.kill();
        //        }
    });
    //    process.stderr.setEncoding('utf8');
    //    process.stderr.on('data', function(data) {
    //
    //    });
    //    process.on('error', function(err) {
    //
    //    });

    /*
        If I get the CURRENT position and send it, it should stay still, right?

        chrisl8@ArloBot:~/arlobot$ rosrun tf tf_echo /map /base_link
        At time 1410717899.809
        - Translation: [1.777, 0.951, 0.101]
        - Rotation: in Quaternion [0.000, 0.000, -0.501, 0.865]

        This works IF you set the goal.target_pose.header.frame_id = "map"
        '''
        '''
        goal.target_pose.pose.position.x = 1.777
        goal.target_pose.pose.position.y = 0.951
        goal.target_pose.pose.position.z = 0.101
        goal.target_pose.pose.orientation.x = 0.0
        goal.target_pose.pose.orientation.y = 0.0
        goal.target_pose.pose.orientation.z = -0.501
        goal.target_pose.pose.orientation.w = 0.865
*/

    process.on('exit', function(code) {
        var reducedElement,
            splitEelement;
        var goalTargetPose = {
            position: {
                x: null,
                y: null,
                z: null
            },
            orientation: {
                x: null,
                y: null,
                z: null,
                w: null
            }
        };
        rawData.split('\n').forEach(function(element, index, array) {
            if (element.indexOf('Translation') > -1) {
                //console.log(element);
                reducedElement = element.replace(/\[|\]|,/g, '')
                splitEelement = reducedElement.split(' ');
                goalTargetPose.position.x = splitEelement[2];
                goalTargetPose.position.y = splitEelement[3];
                goalTargetPose.position.z = splitEelement[4];
            } else if (element.indexOf('Quaternion') > -1) {
                //console.log(element);
                reducedElement = element.replace(/\[|\]|,/g, '')
                splitEelement = reducedElement.split(' ');
                goalTargetPose.orientation.x = splitEelement[4];
                goalTargetPose.orientation.y = splitEelement[5];
                goalTargetPose.orientation.z = splitEelement[6];
                goalTargetPose.orientation.w = splitEelement[7];
            }
        })
        //console.log(goalTargetPose);

        var currentPosition = 'pose: { position: { x: ' + goalTargetPose.position.x + ', y: ' + goalTargetPose.position.y + ', z: ' + goalTargetPose.position.z + ' }, orientation: { x: ' + goalTargetPose.orientation.x + ', y: ' + goalTargetPose.orientation.y + ', z: ' + goalTargetPose.orientation.z + ', w: ' + goalTargetPose.orientation.w + '} }';

        //console.log(currentPosition);

        //console.log(wayPointName);
        callback(currentPosition, wayPointName);

        // Testing Send to same position, for use in another module:
        /*
        // Add frame_id: 'map' header to position for sending to move_base
        var sendPosition = '{ header: { frame_id: "map" }, ' + currentPosition + ' }';
        console.log(sendPosition);

        var newProcess = spawn('unbuffer', ['rostopic', 'pub', '/move_base_simple/goal', 'geometry_msgs/PoseStamped', sendPosition]);
        newProcess.stdout.setEncoding('utf8');
        newProcess.stdout.on('data', function(data) {
            console.log(data);
            //if (data.indexOf('Translation') > -1) {
            //    rawData = data;
            //    process.kill();
            //}
        });
*/
    });
};

// // Require the lib, get a working terminal
// var term = require( 'terminal-kit' ).terminal ;
//
// // The term() function simply output a string to stdout, using current style
// // output "Hello world!" in default terminal's colors
// term( 'Hello world!\n' ) ;
//
// // This output 'red' in red
// term.red( 'red' ) ;
//
// // This output 'bold' in bold
// term.bold( 'bold' ) ;
//
// // output 'mixed' using bold, underlined & red, exposing the style-mixing syntax
// term.bold.underline.red( 'mixed' ) ;
//
// // printf() style formatting everywhere:
// // this will output 'My name is Jack, I'm 32.' in green
// term.green( "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;
//
// // Since v0.16.x, style markup are supported as a shorthand.
// // Those two lines produce the same result.
// term( "My name is " ).red( "Jack" )( " and I'm " ).green( "32\n" ) ;
// term( "My name is ^rJack^ and I'm ^g32\n" ) ;
//
// // Width and height of the terminal
// term( 'The terminal size is %dx%d' , term.width , term.height ) ;
//
// // Move the cursor at the upper-left corner
// term.moveTo( 1 , 1 ) ;
//
// // We can always pass additional arguments that will be displayed...
// term.moveTo( 1 , 1 , 'Upper-left corner' ) ;
//
// // ... and formated
// term.moveTo( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32 ) ;
//
// // ... or even combined with other styles
// term.moveTo.cyan( 1 , 1 , "My name is %s, I'm %d.\n" , 'Jack' , 32  ) ;
//
// // Get some user input
// term.magenta( "Enter your name: " ) ;
// term.inputField(
//     function( error , input ) {
//         term.green( "\nYour name is '%s'\n" , input ) ;
//     }
// ) ;

require('./http_app');
var fs = require('fs');

var mavlink = require('./mavlibrary/mavlink.js');

var term = require( 'terminal-kit' ).terminal ;

var command_items = [ 'Back', 'Arm' , 'Mode', 'Takeoff' , 'GoTo' , 'GoTo_Alt' , 'Hold', 'Change_Speed', 'Land', 'Auto_GoTo', 'Start_Mission', 'WP_YAW_BEHAVIOR', 'WPNAV_SPEED', 'WPNAV_SPEED_DN', 'SYSID_THISMAV', 'Reboot'] ;

var alt_items = ['cancel', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150'] ;

var speed_items = ['cancel', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] ;

var id_items = ['cancel', 'random', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150', '160'] ;

var options = {
    y: 1 ,	// the menu will be on the top of the terminal
    style: term.inverse ,
    selectedStyle: term.dim.blue.bgGreen
} ;


var history = [ 'John' , 'Jack' , 'Joey' , 'Billy' , 'Bob' ] ;
// var mode_items = ['cancel', 'STABILIZE', 'ACRO', 'ALT_HOLD', 'AUTO', 'GUIDED', 'LOITER',
//     'RTL', 'CIRCLE', 'POSITION', 'LAND', 'OF_LOITER', 'DRIFT', 'RESERVED_12', 'SPORT',
//     'FLIP', 'AUTOTUNE', 'POS_HOLD', 'BRAKE', 'THROW', 'AVOID_ADSB', 'GUIDED_NOGPS', 'SAFE_RTL'];
var mode_items = ['cancel', 'STABILIZE', 'ACRO', 'ALT_HOLD', 'AUTO', 'GUIDED', 'LOITER',
    'RTL', 'CIRCLE', 'POSITION', 'LAND', 'OF_LOITER', 'AUTOTUNE', 'POS_HOLD', 'SAFE_RTL'];

var goto_position = {};
var goto_all_position = [];
var target_pub_topic = {};

var drone_items = [];
drone_items.push('Quit');
var target_system_id = {};
var goto_all_index = {};
var goto_all_seq = 0;
for (var idx in conf.drone) {
    if (conf.drone.hasOwnProperty(idx)) {
        drone_items.push(conf.drone[idx].name);
        goto_position[conf.drone[idx].name] = [];
        goto_position[conf.drone[idx].name] = conf.drone[idx].goto_position;
        target_system_id[conf.drone[idx].name] = conf.drone[idx].system_id;
        for (var i in conf.drone[idx].goto_position) {
            if (conf.drone[idx].goto_position.hasOwnProperty(i)) {
                if(goto_all_position[i] == undefined) {
                    goto_all_position[i] = '';
                }
                goto_all_position[i] += (conf.drone[idx].goto_position[i] + '|');

            }
        }
        goto_all_index[conf.drone[idx].name] = goto_all_seq++;

        hb[conf.drone[idx].system_id] = {};
        hb[conf.drone[idx].system_id].base_mode = 0;

        gpi[conf.drone[idx].system_id] = {};
        gpi[conf.drone[idx].system_id].time_boot_ms = 0;
        gpi[conf.drone[idx].system_id].lat = 0;
        gpi[conf.drone[idx].system_id].lon = 0;
        gpi[conf.drone[idx].system_id].alt = 0;
        gpi[conf.drone[idx].system_id].relative_alt = 0;
        gpi[conf.drone[idx].system_id].vx = 0;
        gpi[conf.drone[idx].system_id].vy = 0;

        target_pub_topic[conf.drone[idx].name] = '/Mobius/' + conf.gcs + '/GCS_Data/' + conf.drone[idx].name;
    }
}
drone_items.push('All');

term.clear() ;

var cur_drone_selected = 'none';
var cur_goto_position = 'none';
var cur_mode_selected = 'none';

const back_menu_delay = 50;

function sFact(num)
{
    var rval=1;
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

function startMenu() {
    placeFlag = 'startMenu';
    term.singleLineMenu( drone_items , options , function( error , response ) {
        term('\n').eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        cur_drone_selected = response.selectedText;

        //console.log(response.selectedIndex);

        if(response.selectedText === 'All') {
            allMenu();
        }
        else if (response.selectedText === 'Quit') {
            process.exit();
        }
        else {
            eachMenu();
        }
    });
}

var curAllMenuIndex = 0;
function allMenu() {
    placeFlag = 'allMenu';
    term('\n').eraseDisplayBelow();

    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.blue.bgGreen,
        selectedIndex: curAllMenuIndex
    };

    //term('').eraseLineAfter.green("%s selected\n", cur_drone_selected) ;

    term.singleLineMenu(command_items, _options, function (error, response) {
        term('\n').eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        curAllMenuIndex = response.selectedIndex;

        if (response.selectedText === 'Back') {
            setTimeout(startMenu,  back_menu_delay);
        }
        else if (response.selectedText === 'Arm') {
            allArmMenu();
        }
        else if (response.selectedText === 'Takeoff') {
            allTakeoffMenu();
        }
        else if (response.selectedText === 'Mode') {
            allModeMenu();
        }
        else if (response.selectedText === 'GoTo') {
            allGotoMenu();
        }
        else if (response.selectedText === 'GoTo_Alt') {
            allGotoAltMenu();
        }
        else if (response.selectedText === 'Change_Speed') {
            allChangeSpeedMenu();
        }
        else if (response.selectedText === 'Hold') {
            allHoldMenu();
        }
        else if (response.selectedText === 'Land') {
            allLandMenu();
        }
        else if (response.selectedText === 'Auto_GoTo') {
            allAutoAllGotoMenu();
        }
        else if (response.selectedText === 'Start_Mission') {
            allStartMissionMenu();
        }
        else if (response.selectedText === 'WP_YAW_BEHAVIOR') {
            term.eraseDisplayBelow();
            term('Select Value: ');

            term.singleColumnMenu( ['cancel', '0: Never change yaw', '1: Face next waypoint', '2: Face next waypoint except RTL', '3: Face along GPS course'] , function( error , response ) {
                term( '\n' ).eraseLineAfter.green(
                    "#%s selected: %s (%s,%s)\n" ,
                    response.selectedIndex ,
                    response.selectedText ,
                    response.x ,
                    response.y
                ) ;
                var input = response.selectedText;
                if(input === 'cancel') {
                    setTimeout(allMenu,  back_menu_delay);
                }
                else {
                    history.push(input);
                    history.shift();

                    var param_value = parseInt(response.selectedIndex, 10) - 1;

                    if(param_value > 3) {
                        param_value = 3;
                    }

                    if(param_value < 0) {
                        param_value = 0
                    }

                    console.log(param_value);

                    var command_delay = 0;
                    for (var idx in conf.drone) {
                        if (conf.drone.hasOwnProperty(idx)) {
                            cur_drone_selected = conf.drone[idx].name;

                            command_delay++;

                            setTimeout(send_wp_yaw_behavior_param_set_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], param_value);
                        }
                    }

                    setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
                }
            } ) ;
        }
        else if (response.selectedText === 'WPNAV_SPEED') {
            term.eraseDisplayBelow();
            term('Select Speed (1 - 12 (m/s)): ');

            term.inputField(
                {history: history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input === 'cancel') {
                        setTimeout(allMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        var speed = parseFloat(input);

                        if(speed > 12.0) {
                            speed = 12.0;
                        }

                        if(speed < 1) {
                            speed = 1.0
                        }

                        var command_delay = 0;
                        for (var idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                cur_drone_selected = conf.drone[idx].name;

                                command_delay++;

                                setTimeout(send_wpnav_speed_param_set_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                            }
                        }

                        setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
                    }
                }
            );
        }
        else if (response.selectedText === 'WPNAV_SPEED_DN') {
            term.eraseDisplayBelow();
            term('Select Speed (1 - 12 (m/s)): ');

            term.inputField(
                {history: history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input === 'cancel') {
                        setTimeout(allMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        var speed = parseFloat(input);

                        if(speed > 12.0) {
                            speed = 12.0;
                        }

                        if(speed < 1) {
                            speed = 1.0
                        }

                        var command_delay = 0;
                        for (var idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                cur_drone_selected = conf.drone[idx].name;

                                command_delay++;

                                setTimeout(send_wpnav_speed_dn_param_set_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                            }
                        }

                        setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
                    }
                }
            );
        }
        else if (response.selectedText === 'SYSID_THISMAV') {
            term.eraseDisplayBelow();

            term.red('Changing sys_id here is not supported');
            setTimeout(allMenu,  back_menu_delay);
        }
        else if (response.selectedText === 'Reboot') {
            term.eraseDisplayBelow();
            term('Are you sure? (Y / N): ');
            term.inputField(
                {history: history, autoComplete: ['cancel', 'Y', 'N'], autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input.toLowerCase() === 'n' || input === 'cancel') {
                        setTimeout(allMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        var command_delay = 0;
                        for (var idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                cur_drone_selected = conf.drone[idx].name;

                                command_delay++;

                                setTimeout(send_reboot_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected]);
                            }
                        }
                        setTimeout(allMenu, back_menu_delay * command_delay + back_menu_delay);
                    }
                }
            );
        }
        else {
            setTimeout(startMenu,  back_menu_delay);
        }
    });
}

function allArmMenu() {
    term.eraseDisplayBelow();
    var command_delay = 0;
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;

            command_delay++;
            setTimeout(send_arm_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], 1, 0);
        }
    }

    setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
}

function allModeMenu() {
    var _options = {
        selectedIndex: 0
    };

    term.eraseDisplayBelow();
    term('Select Mode : ');

    term.singleColumnMenu( mode_items , _options, function( error , response ) {
        term('\n').eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        var input = response.selectedText;
        if(input === 'cancel') {
            setTimeout(allMenu,  back_menu_delay);
        }
        else {
            cur_mode_selected = input;
            history.push(input);
            history.shift();

            var custom_mode = mode_items.indexOf(cur_mode_selected) - 1;
            var command_delay = 0;
            for (var idx in conf.drone) {
                if (conf.drone.hasOwnProperty(idx)) {
                    cur_drone_selected = conf.drone[idx].name;

                    command_delay++;

                    var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                    base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                    setTimeout(send_set_mode_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);
                }
            }

            setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
        }
    });
}

function actionAllGoto(input) {
    cur_goto_position = input;
    var arr_goto_all_position = cur_goto_position.split('|');

    var command_delay = 0;
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;
            cur_goto_position = arr_goto_all_position[goto_all_index[conf.drone[idx].name]];
            command_delay++;

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

            var arr_cur_goto_position = cur_goto_position.split(':');
            var lat = parseFloat(arr_cur_goto_position[0]);
            var lon = parseFloat(arr_cur_goto_position[1]);
            var alt = parseFloat(arr_cur_goto_position[2]);
            var speed = parseFloat(arr_cur_goto_position[3]);

            setTimeout(send_goto_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);

            setTimeout(send_change_speed_command, back_menu_delay + back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
        }
    }
}

var curAllGotoIndex = 0;
function allGotoMenu() {
    var _options = {
        selectedIndex: curAllGotoIndex
    };

    term.eraseDisplayBelow();
    term('Select Position : ');

    term.singleColumnMenu( goto_all_position , _options, function( error , response ) {
        term( '\n' ).eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n" ,
            response.selectedIndex ,
            response.selectedText ,
            response.x ,
            response.y
        ) ;

        curAllGotoIndex = response.selectedIndex;
        var input = response.selectedText;
        if(input.split('|')[0] === 'cancel') {
            setTimeout(allMenu,  back_menu_delay);
        }
        else {
            history.push(input);
            history.shift();

            actionAllGoto(input);

            setTimeout(allMenu,  back_menu_delay + back_menu_delay * (conf.drone.length+1));
        }
    });
}

function allTakeoffMenu() {
    term.eraseDisplayBelow();
    term('Select Height : ');

    term.inputField(
        {history: history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                history.push(input);
                history.shift();

                var alt = parseFloat(input);

                if(alt < 2.0) {
                    alt = 2.0;
                }

                var command_delay = 0;
                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        cur_drone_selected = conf.drone[idx].name;

                        command_delay++;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                        setTimeout(send_arm_command, back_menu_delay * 20 + back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], 1, 0);

                        setTimeout(send_takeoff_command, back_menu_delay * 140 + back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], alt);
                    }
                }
                setTimeout(allMenu, back_menu_delay * 160 + back_menu_delay * (conf.drone.length + 1));
            }
        }
    );
}

function allGotoAltMenu() {
    term.eraseDisplayBelow();
    term('Select Altitude : ');

    term.inputField(
        {history: history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if(input === 'cancel') {
                setTimeout(allMenu,  back_menu_delay);
            }
            else {
                history.push(input);
                history.shift();

                var alt = parseFloat(input);

                var command_delay = 0;
                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        cur_drone_selected = conf.drone[idx].name;

                        command_delay++;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                        var lat = gpi[target_system_id[cur_drone_selected]].lat / 10000000;
                        var lon = gpi[target_system_id[cur_drone_selected]].lon / 10000000;

                        setTimeout(send_goto_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);
                    }
                }

                setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
            }
        }
    );
}

const unit_gap = 1000;
function allChangeSpeedMenu() {
    term.eraseDisplayBelow();
    term('Select Speed (1 - 12 (m/s)): ');

    term.inputField(
        {history: history, autoComplete: speed_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if(input === 'cancel') {
                setTimeout(allMenu,  back_menu_delay);
            }
            else {
                history.push(input);
                history.shift();

                var speed = parseFloat(input);

                if(speed > 12.0) {
                    speed = 12.0;
                }

                if(speed < 1) {
                    speed = 1.0
                }

                var command_delay = 0;
                var max_gap = 0;
                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        cur_drone_selected = conf.drone[idx].name;

                        command_delay++;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                        var cur_speed = Math.abs(Math.sqrt((gpi[target_system_id[cur_drone_selected]].vx / 100) * (gpi[target_system_id[cur_drone_selected]].vx / 100) + (gpi[target_system_id[cur_drone_selected]].vy / 100) * (gpi[target_system_id[cur_drone_selected]].vy / 100)));
                        cur_speed = Math.round(cur_speed);
                        var gap_count = 0;
                        if(cur_speed > speed) {
                            gap_count = 0;
                            for(var i = cur_speed - 1; i > speed; i--) {
                                setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], i);
                                gap_count++;
                            }
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                        }
                        else if(cur_speed < speed) {
                            gap_count = 0;
                            for(i = cur_speed + 1; i < speed; i++) {
                                setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], i);
                                gap_count++;
                            }
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                        }
                        else {
                            gap_count = 0;
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                        }

                        if(max_gap < gap_count) {
                            max_gap = gap_count;
                        }
                    }
                }

                setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1) + (unit_gap * max_gap));
            }
        }
    );
}

function allHoldMenu() {
    term.eraseDisplayBelow();

    var command_delay = 0;
    for (idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;

            command_delay++;

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

            var lat = gpi[target_system_id[cur_drone_selected]].lat / 10000000;
            var lon = gpi[target_system_id[cur_drone_selected]].lon / 10000000;
            var alt = gpi[target_system_id[cur_drone_selected]].relative_alt / 1000;

            setTimeout(send_goto_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);
        }
    }

    setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
}

function allLandMenu() {
    term.eraseDisplayBelow();
    var command_delay = 0;
    for (idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;

            command_delay++;
            setTimeout(send_land_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected]);
        }
    }

    setTimeout(allMenu,  back_menu_delay * (conf.drone.length+1));
}

var key = '';

term.grabInput() ;

term.on( 'key' , function( name , matches , data ) {
    //console.log( "'key' event:" , name ) ;

    key = name;

    // Detect CTRL-C and exit 'manually'
    if ( name === 'CTRL_C' ) {
        process.exit() ;
    }
});

var ori_dist = 0;
var cur_dist = 0;

function calcAllDistance(goto_position) {
    var dist = 0;
    var arr_goto_all_position = goto_position.split('|');
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;
            cur_goto_position = arr_goto_all_position[goto_all_index[conf.drone[idx].name]];

            var cur_lat = gpi[target_system_id[cur_drone_selected]].lat / 10000000;
            var cur_lon = gpi[target_system_id[cur_drone_selected]].lon / 10000000;
            var cur_alt = gpi[target_system_id[cur_drone_selected]].relative_alt / 1000;

            var arr_cur_goto_position = cur_goto_position.split(':');
            var tar_lat = parseFloat(arr_cur_goto_position[0]);
            var tar_lon = parseFloat(arr_cur_goto_position[1]);
            var tar_alt = parseFloat(arr_cur_goto_position[2]);

            dist += Math.sqrt(Math.pow((tar_lat - cur_lat), 2) + Math.pow((tar_lon - cur_lon), 2) + Math.pow((tar_alt - cur_alt), 2));
        }
    }

    return dist;
}

var pre_progress = 0;
var abnormal_count = 0;
function doProgress(selectedIndex, input, callback)
{
    if(key === 'BACKSPACE') {
        key = '';
        progress = 1;
        progressBar.update(progress);

        callback('404');
    }
    else {
        cur_dist = calcAllDistance(input);

        progress = (ori_dist - cur_dist) / ori_dist;
        if(progress > 0.95) {
            progress = 1;
        }
        progressBar.update(progress);

        if (progress >= 1) {
            callback('200');
        }
        else if (Math.abs(pre_progress - progress) < 0.01) {
            pre_progress = progress;
            abnormal_count++;
            if(abnormal_count > 8) {
                progress = 1;
                progressBar.update(progress);
                callback('500');
            }
            else {
                setTimeout(doProgress, 100 + Math.random() * 400, selectedIndex, input, function (code) {
                    callback(code);
                });
            }
        }
        else {
            pre_progress = progress;
            cur_dist = 0;
            setTimeout(doProgress, 100 + Math.random() * 400, selectedIndex, input, function (code) {
                callback(code);
            });
        }
    }
}

function actionProgressBar(selectedIndex, input) {
    progressBar = term.progressBar( {
        width: 80 ,
        title: 'In flight:' ,
        eta: true ,
        percent: true
    });

    ori_dist = calcAllDistance(input);
    cur_dist = 0;
    abnormal_count = 0;

    progress = 0;
    doProgress(selectedIndex, input, function (code) {
        if(code === '404') {
            term.red('\ncanceled\n');
            setTimeout(allMenu, back_menu_delay + back_menu_delay * (conf.drone.length + 1));
        }
        else if(code === '500') {
            term.red('\ndrone is no response\n');
            setTimeout(allMenu, back_menu_delay + back_menu_delay * (conf.drone.length + 1));
        }
        else {
            if (++selectedIndex >= goto_all_position.length) {
                setTimeout(allMenu, back_menu_delay + back_menu_delay * (conf.drone.length + 1));
            }
            else {
                // todo: 목적지에 도달한 뒤 대기 시간 기다리는 것 추가할 것, 개별 드론별 대기시간 주는 건 어려울 듯

                setTimeout(actionAutoAllGoto, back_menu_delay + back_menu_delay * (conf.drone.length + 1), selectedIndex);
            }
        }
    });
}


var progress = 0;
var progressBar = null;
function actionAutoAllGoto(selectedIndex) {
    curAllAutoGotoIndex = selectedIndex;
    var input = goto_all_position[selectedIndex];
    if(input.split('|')[0] === 'cancel') {
        actionAutoAllGoto(++selectedIndex);
    }
    else {
        term('\n').eraseLineAfter.green("%d : %s\n", selectedIndex, input);

        actionAllGoto(input);

        setTimeout(actionProgressBar,  back_menu_delay + back_menu_delay * (conf.drone.length+1), selectedIndex, input);
    }
}

var curAllAutoGotoIndex = 0;
function allAutoAllGotoMenu() {
    term.eraseDisplayBelow();
    term('Send GoTo command automatically');

    actionAutoAllGoto(0);
}

function allStartMissionMenu() {
    term.eraseDisplayBelow();
    var command_delay = 0;
    for (idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;

            command_delay++;

            setTimeout(send_arm_command, back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected],1, 0);

            setTimeout(send_start_mission_command, back_menu_delay * 100 + back_menu_delay * command_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], 0, 7);
        }
    }

    setTimeout(allMenu,  back_menu_delay * 100 + back_menu_delay * (conf.drone.length+1));
}

var curEachMenuIndex = 0;
function eachMenu() {
    placeFlag = 'eachMenu';
    term('\n').eraseDisplayBelow();

    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.blue.bgGreen,
        selectedIndex: curEachMenuIndex
    };

    term.singleLineMenu(command_items, _options, function (error, response) {
        term('\n').eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        curEachMenuIndex = response.selectedIndex;

        if (response.selectedText === 'Back') {
            setTimeout(startMenu,  back_menu_delay);
        }
        else if (response.selectedText === 'Arm') {
            eachArmMenu();
        }
        else if (response.selectedText === 'Mode') {
            eachModeMenu();
        }
        else if (response.selectedText === 'Takeoff') {
            eachTakeoffMenu();
        }
        else if (response.selectedText === 'GoTo') {
            eachGotoMenu();
        }
        else if (response.selectedText === 'GoTo_Alt') {
            eachGotoAltMenu();
        }
        else if (response.selectedText === 'Change_Speed') {
            eachChangeSpeedMenu();
        }
        else if (response.selectedText === 'Hold') {
            eachHoldMenu();
        }
        else if (response.selectedText === 'Land') {
            eachLandMenu();
        }
        else if (response.selectedText === 'Start_Mission') {
            eachStartMissionMenu();
        }
        else if (response.selectedText === 'WP_YAW_BEHAVIOR') {
            term.eraseDisplayBelow();
            term('Select Value: ');

            term.singleColumnMenu( ['cancel', '0: Never change yaw', '1: Face next waypoint', '2: Face next waypoint except RTL', '3: Face along GPS course'] , function( error , response ) {
                term('\n').eraseLineAfter.green(
                    "#%s selected: %s (%s,%s)\n",
                    response.selectedIndex,
                    response.selectedText,
                    response.x,
                    response.y
                );
                var input = response.selectedText;
                if(input === 'cancel') {
                    setTimeout(eachMenu,  back_menu_delay);
                }
                else {
                    history.push(input);
                    history.shift();

                    var param_value = parseInt(response.selectedIndex, 10) - 1;

                    if(param_value > 3) {
                        param_value = 3;
                    }

                    if(param_value < 0) {
                        param_value = 0
                    }

                    console.log(param_value);

                    setTimeout(send_wp_yaw_behavior_param_set_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], param_value);

                    setTimeout(eachMenu,  back_menu_delay * 2);
                }
            });
        }
        else if (response.selectedText === 'WPNAV_SPEED') {
            term.eraseDisplayBelow();
            term('Select Speed (1 - 12 (m/s)): ');

            term.inputField(
                {history: history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input === 'cancel') {
                        setTimeout(eachMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        // var custom_mode = 4;
                        // var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        // base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        // send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                        var speed = parseFloat(input);

                        if(speed > 12.0) {
                            speed = 12.0;
                        }

                        if(speed < 1) {
                            speed = 1.0
                        }

                        setTimeout(send_wpnav_speed_param_set_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);

                        setTimeout(eachMenu,  back_menu_delay * 2);
                    }
                }
            );
        }
        else if (response.selectedText === 'WPNAV_SPEED_DN') {
            term.eraseDisplayBelow();
            term('Select Speed (1 - 12 (m/s)): ');

            term.inputField(
                {history: history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input === 'cancel') {
                        setTimeout(eachMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        // var custom_mode = 4;
                        // var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        // base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        // send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                        var speed = parseFloat(input);

                        if(speed > 12.0) {
                            speed = 12.0;
                        }

                        if(speed < 1) {
                            speed = 1.0
                        }

                        setTimeout(send_wpnav_speed_dn_param_set_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);

                        setTimeout(eachMenu,  back_menu_delay * 2);
                    }
                }
            );
        }
        else if (response.selectedText === 'SYSID_THISMAV') {
            term.eraseDisplayBelow();
            term('Select id (random, 10 - 250): ');

            term.inputField(
                {history: history, autoComplete: id_items, autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input === 'cancel') {
                        setTimeout(eachMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        if(input === 'random') {
                            var id_val = parseInt(10 + Math.random() * 250, 10);
                        }
                        else {
                            id_val = parseInt(input, 10);
                        }

                        if(id_val > 250) {
                            term.red('id is out of range.\n');
                            setTimeout(eachMenu,  back_menu_delay);
                        }
                        else if(id_val < 10) {
                            term.red('id is out of range.\n');
                            setTimeout(eachMenu,  back_menu_delay);
                        }
                        else {
                            term.red('The selected id is %d\n', id_val);
                            setTimeout(send_sysid_thismav_param_set_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], id_val);

                            for (var idx in conf.drone) {
                                if (conf.drone.hasOwnProperty(idx)) {
                                    if(cur_drone_selected === conf.drone[idx].name) {
                                        conf.drone[idx].system_id = id_val;
                                        break;
                                    }
                                }
                            }

                            fs.writeFileSync(drone_info_file, JSON.stringify(conf.drone, null, 4), 'utf8');

                            setTimeout(eachMenu,  back_menu_delay * 2);
                        }
                    }
                }
            );
        }
        else if (response.selectedText === 'Reboot') {
            term.eraseDisplayBelow();
            term('Are you sure? (Y / N): ');

            term.inputField(
                {history: history, autoComplete: ['cancel', 'Y', 'N'], autoCompleteMenu: true},
                function (error, input) {
                    term( '\n' ).eraseLineAfter.green(
                        "%s selected\n" ,
                        input
                    ) ;
                    if(input.toLowerCase() === 'n' || input === 'cancel') {
                        setTimeout(eachMenu,  back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        setTimeout(send_reboot_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected]);

                        setTimeout(eachMenu,  back_menu_delay * 2);
                    }
                }
            );
        }
        else {
            setTimeout(startMenu,  back_menu_delay);
        }
    });
}

function eachArmMenu() {
    term.eraseDisplayBelow();

    send_arm_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected],1, 0);

    setTimeout(eachMenu,  back_menu_delay);
}

function eachModeMenu() {
    var _options = {
        selectedIndex: 0
    };

    term.eraseDisplayBelow();
    term('Select Mode : ');

    term.singleColumnMenu( mode_items , _options, function( error , response ) {
        term('\n').eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        var input = response.selectedText;
        if (input === 'cancel') {
            setTimeout(eachMenu, back_menu_delay);
        }
        else {
            cur_mode_selected = input;
            history.push(input);
            history.shift();

            var custom_mode = mode_items.indexOf(cur_mode_selected) - 1;
            var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

            setTimeout(eachMenu, back_menu_delay);
        }
    });
}

function eachTakeoffMenu() {
    term.eraseDisplayBelow();
    term('Select Height : ');

    term.inputField(
        {history: history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if (input === 'cancel') {
                setTimeout(eachMenu, back_menu_delay);
            } else {
                history.push(input);
                history.shift();

                var alt = parseFloat(input);

                if (alt < 2.0) {
                    alt = 2.0;
                }

                var custom_mode = 4;
                var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                setTimeout(send_arm_command, back_menu_delay * 20, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], 1, 0);

                setTimeout(send_takeoff_command, back_menu_delay * 140, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], alt);

                setTimeout(eachMenu, back_menu_delay * 150 + back_menu_delay);
            }
        }
    );
}

var curEachGotoIndex = 0;
function eachGotoMenu() {
    term.eraseDisplayBelow();
    term('Select Position : ');

    var _options = {
        selectedIndex: curEachGotoIndex
    };

    term.singleColumnMenu( goto_position[cur_drone_selected] , _options, function( error , response ) {
        term( '\n' ).eraseLineAfter.green(
            "#%s selected: %s (%s,%s)\n" ,
            response.selectedIndex ,
            response.selectedText ,
            response.x ,
            response.y
        ) ;

        curEachGotoIndex = response.selectedIndex;

        var input = response.selectedText;
        if(input === 'cancel') {
            setTimeout(eachMenu,  back_menu_delay);
        }
        else {
            cur_goto_position = input;
            history.push(input);
            history.shift();

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

            var arr_cur_goto_position = cur_goto_position.split(':');
            var lat = parseFloat(arr_cur_goto_position[0]);
            var lon = parseFloat(arr_cur_goto_position[1]);
            var alt = parseFloat(arr_cur_goto_position[2]);
            var speed = parseFloat(arr_cur_goto_position[3]);

            setTimeout(send_goto_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);

            setTimeout(send_change_speed_command, back_menu_delay + back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);

            setTimeout(eachMenu,  back_menu_delay + back_menu_delay + back_menu_delay);
        }
    } ) ;
}

function eachGotoAltMenu() {
    term.eraseDisplayBelow();
    term('Select Altitude : ');

    term.inputField(
        {history: history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if(input === 'cancel') {
                setTimeout(eachMenu,  back_menu_delay);
            }
            else {
                history.push(input);
                history.shift();

                var custom_mode = 4;
                var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                var alt = parseFloat(input);

                var lat = gpi[target_system_id[cur_drone_selected]].lat / 10000000;
                var lon = gpi[target_system_id[cur_drone_selected]].lon / 10000000;

                setTimeout(send_goto_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);

                setTimeout(eachMenu,  back_menu_delay * 2);
            }
        }
    );
}

function eachHoldMenu() {
    term.eraseDisplayBelow();

    var custom_mode = 4;
    var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
    base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
    send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

    var lat = gpi[target_system_id[cur_drone_selected]].lat / 10000000;
    var lon = gpi[target_system_id[cur_drone_selected]].lon / 10000000;
    var alt = gpi[target_system_id[cur_drone_selected]].relative_alt / 1000;

    setTimeout(send_goto_command, back_menu_delay, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], lat, lon, alt);

    setTimeout(eachMenu,  back_menu_delay * 2);
}

function eachChangeSpeedMenu() {
    term.eraseDisplayBelow();
    term('Select Speed (1 - 12 (m/s)): ');

    term.inputField(
        {history: history, autoComplete: speed_items, autoCompleteMenu: true},
        function (error, input) {
            term( '\n' ).eraseLineAfter.green(
                "%s selected\n" ,
                input
            ) ;
            if(input === 'cancel') {
                setTimeout(eachMenu,  back_menu_delay);
            }
            else {
                history.push(input);
                history.shift();

                var custom_mode = 4;
                var base_mode = hb[target_system_id[cur_drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                send_set_mode_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], base_mode, custom_mode);

                var speed = parseFloat(input);

                if(speed > 12.0) {
                    speed = 12.0;
                }

                if(speed < 1) {
                    speed = 1.0
                }

                var cur_speed = Math.abs(Math.sqrt((gpi[target_system_id[cur_drone_selected]].vx / 100) * (gpi[target_system_id[cur_drone_selected]].vx / 100) + (gpi[target_system_id[cur_drone_selected]].vy / 100) * (gpi[target_system_id[cur_drone_selected]].vy / 100)));
                cur_speed = Math.round(cur_speed);
                console.log(cur_speed);
                var gap_count = 0;
                if(cur_speed > speed) {
                    gap_count = 0;
                    for(var i = cur_speed - 1; i > speed; i--) {
                        setTimeout(send_change_speed_command, back_menu_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], i);
                        gap_count++;
                    }
                    setTimeout(send_change_speed_command, back_menu_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                }
                else if(cur_speed < speed) {
                    gap_count = 0;
                    for(i = cur_speed + 1; i < speed; i++) {
                        setTimeout(send_change_speed_command, back_menu_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], i);
                        gap_count++;
                    }
                    setTimeout(send_change_speed_command, back_menu_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                }
                else {
                    gap_count = 0;
                    setTimeout(send_change_speed_command, back_menu_delay + (unit_gap * gap_count), cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected], speed);
                }

                setTimeout(eachMenu,  back_menu_delay * 2 + (unit_gap * gap_count));
            }
        }
    );
}

function eachLandMenu() {
    term.eraseDisplayBelow();

    send_land_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected]);

    setTimeout(eachMenu,  back_menu_delay);
}

function eachStartMissionMenu() {
    term.eraseDisplayBelow();

    send_arm_command(cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected],1, 0);

    setTimeout(send_start_mission_command, back_menu_delay * 100, cur_drone_selected, target_pub_topic[cur_drone_selected], target_system_id[cur_drone_selected],0, 7);

    setTimeout(eachMenu,  back_menu_delay * 100 + back_menu_delay);
}

setTimeout(startMenu,  back_menu_delay);

function mavlinkGenerateMessage(src_sys_id, src_comp_id, type, params) {
    const mavlinkParser = new MAVLink(null/*logger*/, src_sys_id, src_comp_id);
    try {
        var mavMsg = null;
        var genMsg = null;
        //var targetSysId = sysId;
        var targetCompId = (params.targetCompId == undefined)?
            0:
            params.targetCompId;

        switch( type ) {
            // MESSAGE ////////////////////////////////////
            case mavlink.MAVLINK_MSG_ID_PING:
                mavMsg = new mavlink.messages.ping(params.time_usec, params.seq, params.target_system, params.target_component);
                break;
            case mavlink.MAVLINK_MSG_ID_HEARTBEAT:
                mavMsg = new mavlink.messages.heartbeat(params.type,
                    params.autopilot,
                    params.base_mode,
                    params.custom_mode,
                    params.system_status,
                    params.mavlink_version);
                break;
            case mavlink.MAVLINK_MSG_ID_GPS_RAW_INT:
                mavMsg = new mavlink.messages.gps_raw_int(params.time_usec,
                    params.fix_type,
                    params.lat,
                    params.lon,
                    params.alt,
                    params.eph,
                    params.epv,
                    params.vel,
                    params.cog,
                    params.satellites_visible,
                    params.alt_ellipsoid,
                    params.h_acc,
                    params.v_acc,
                    params.vel_acc,
                    params.hdg_acc);
                break;
            case mavlink.MAVLINK_MSG_ID_ATTITUDE:
                mavMsg = new mavlink.messages.attitude(params.time_boot_ms,
                    params.roll,
                    params.pitch,
                    params.yaw,
                    params.rollspeed,
                    params.pitchspeed,
                    params.yawspeed);
                break;
            case mavlink.MAVLINK_MSG_ID_GLOBAL_POSITION_INT:
                mavMsg = new mavlink.messages.global_position_int(params.time_boot_ms,
                    params.lat,
                    params.lon,
                    params.alt,
                    params.relative_alt,
                    params.vx,
                    params.vy,
                    params.vz,
                    params.hdg);
                break;
            case mavlink.MAVLINK_MSG_ID_RC_CHANNELS_OVERRIDE:
                mavMsg = new mavlink.messages.rc_channels_override(params.target_system,
                    params.target_component,
                    params.chan1_raw,
                    params.chan2_raw,
                    params.chan3_raw,
                    params.chan4_raw,
                    params.chan5_raw,
                    params.chan6_raw,
                    params.chan7_raw,
                    params.chan8_raw);
                break;
            case mavlink.MAVLINK_MSG_ID_COMMAND_LONG:
                mavMsg = new mavlink.messages.command_long(params.target_system,
                    params.target_component,
                    params.command,
                    params.confirmation,
                    params.param1,
                    params.param2,
                    params.param3,
                    params.param4,
                    params.param5,
                    params.param6,
                    params.param7);
                break;

            case mavlink.MAVLINK_MSG_ID_MISSION_ITEM:
                mavMsg = new mavlink.messages.mission_item(params.target_system,
                    params.target_component,
                    params.seq,
                    params.frame,
                    params.command,
                    params.current,
                    params.autocontinue,
                    params.param1,
                    params.param2,
                    params.param3,
                    params.param4,
                    params.param5,
                    params.param6,
                    params.param7,
                    params.mission_type);
                break;

            case mavlink.MAVLINK_MSG_ID_SET_MODE:
                mavMsg = new mavlink.messages.set_mode(params.target_system,
                    params.base_mode,
                    params.custom_mode);
                break;

            case mavlink.MAVLINK_MSG_ID_PARAM_SET:
                mavMsg = new mavlink.messages.param_set(params.target_system,
                    params.target_component,
                    params.param_id,
                    params.param_value,
                    params.param_type);
                break;
        }
    }
    catch( e ) {
        console.log( 'MAVLINK EX:' + e );
    }

    if (mavMsg) {
        genMsg = Buffer.from(mavMsg.pack(mavlinkParser));
        //console.log('>>>>> MAVLINK OUTGOING MSG: ' + genMsg.toString('hex'));
    }

    return genMsg;
}

function send_reboot_command(target_name, pub_topic, target_sys_id) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN;
    btn_params.confirmation = 0;
    btn_params.param1 = 1;
    btn_params.param2 = 0;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = 0;
    btn_params.param6 = 0;
    btn_params.param7 = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send Reboot command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_arm_command(target_name, pub_topic, target_sys_id, param1, param2) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_COMPONENT_ARM_DISARM;
    btn_params.confirmation = 0;
    btn_params.param1 = param1;
    btn_params.param2 = param2;
    btn_params.param3 = 65535;
    btn_params.param4 = 65535;
    btn_params.param5 = 65535;
    btn_params.param6 = 65535;
    btn_params.param7 = 65535;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send Arm command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_start_mission_command(target_name, pub_topic, target_sys_id, param1, param2) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_MISSION_START;
    btn_params.confirmation = 0;
    btn_params.param1 = param1;
    btn_params.param2 = param2;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = 0;
    btn_params.param6 = 0;
    btn_params.param7 = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('Send Start Mission command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_takeoff_command(target_name, pub_topic, target_sys_id, alt) {
    // var btn_params = {};
    // btn_params.target_system = target_sys_id;
    // btn_params.target_component = 1;
    // btn_params.seq = 0;
    // btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    // btn_params.command = mavlink.MAV_CMD_NAV_TAKEOFF;
    // btn_params.current = 2;
    // btn_params.autocontinue = 1;
    // btn_params.param1 = 0; // Minimum pitch (if airspeed sensor present)
    // btn_params.param2 = 0; // Empty
    // btn_params.param3 = 0; // Empty
    // btn_params.param4 = 0; // Yaw angle
    // btn_params.param5 = 0; // Latitude
    // btn_params.param6 = 0; // Longitude
    // btn_params.param7 = alt; // Altitude
    // btn_params.mission_type = 0;

    // var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);

    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_NAV_TAKEOFF;
    btn_params.confirmation = 1;
    btn_params.param1 = 0; // Minimum pitch (if airspeed sensor present)
    btn_params.param2 = 0; // Empty
    btn_params.param3 = 0; // Empty
    btn_params.param4 = 0; // Yaw angle
    btn_params.param5 = 0; // Latitude
    btn_params.param6 = 0; // Longitude
    btn_params.param7 = alt; // Altitude

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('Send Takeoff command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_set_mode_command(target_name, pub_topic, target_sys_id, base_mode, custom_mode) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.base_mode = base_mode;
    btn_params.custom_mode = custom_mode;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_SET_MODE, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('Send Set Mode command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }

    // var btn_params = {};
    // btn_params.target_system = target_sys_id;
    // btn_params.target_component = 1;
    // btn_params.command = mavlink.MAV_CMD_DO_SET_MODE;
    // btn_params.confirmation = 0;
    // btn_params.param1 = param1; // Mode
    // btn_params.param2 = param2; // Custom Mode
    // btn_params.param3 = param3; // Custom Submode
    // btn_params.param4 = 65535;
    // btn_params.param5 = 65535;
    // btn_params.param6 = 65535;
    // btn_params.param7 = 65535;
    //
    // try {
    //     var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
    //     if (msg == null) {
    //         console.log("mavlink message is null");
    //     }
    //     else {
    //         //console.log('msg: ', msg);
    //         term.blue('Send Set Mode command to %s\n', target_name);
    //         term.red('msg: ' +  msg.toString('hex') + '\n');
    //         // console.log('msg_seq : ', msg.slice(2,3));
    //         //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
    //         //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
    //         mqtt_client.publish(pub_topic, msg);
    //     }
    // }
    // catch( ex ) {
    //     console.log( '[ERROR] ' + ex );
    // }
}

var goto_sequence = 0;
function send_goto_command(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.seq = 0;
    btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
    btn_params.current = 2;
    btn_params.autocontinue = 1;
    btn_params.param1 = 0;
    btn_params.param2 = 0;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = latitude;
    btn_params.param6 = longitude;
    btn_params.param7 = rel_altitude;
    btn_params.mission_type = 0;

    //console.log(latitude, longitude, rel_altitude);

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('Send GoTo command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_alt_command(target_name, pub_topic, target_sys_id, rel_altitude) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.seq = 0;
    btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
    btn_params.current = 2;
    btn_params.autocontinue = 1;
    btn_params.param1 = 0;
    btn_params.param2 = 0;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = 0;
    btn_params.param6 = 0;
    btn_params.param7 = rel_altitude;
    btn_params.mission_type = 0;

    // var btn_params = {};
    // btn_params.target_system = target_sys_id;
    // btn_params.target_component = 1;
    // btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
    // btn_params.confirmation = 0;
    // btn_params.param1 = 0; // Abort Alt
    // btn_params.param2 = 0; // Land Mode
    // btn_params.param3 = 0; // Empty
    // btn_params.param4 = 0; // Yaw angle
    // btn_params.param5 = 0; // Latitude
    // btn_params.param6 = 0; // Longitude
    // btn_params.param7 = rel_altitude; // Altitude

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        //var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('\nSend GoTo command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_land_command(target_name, pub_topic, target_sys_id) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_NAV_LAND;
    btn_params.confirmation = 0;
    btn_params.param1 = 0; // Abort Alt
    btn_params.param2 = 0; // Land Mode
    btn_params.param3 = 0; // Empty
    btn_params.param4 = 0; // Yaw angle
    btn_params.param5 = 0; // Latitude
    btn_params.param6 = 0; // Longitude
    btn_params.param7 = 0; // Altitude

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send GoTo command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_change_speed_command(target_name, pub_topic, target_sys_id, target_speed) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_DO_CHANGE_SPEED;
    btn_params.confirmation = 0;
    btn_params.param1 = 0; // Speed type (0=Airspeed, 1=Ground Speed).
    btn_params.param2 = target_speed; // Target speed (m/s).
    btn_params.param3 = 0; // Throttle as a percentage (0-100%). A value of -1 indicates no change.
    btn_params.param4 = 0; // Empty
    btn_params.param5 = 0; // Empty
    btn_params.param6 = 0; // Empty
    btn_params.param7 = 0; // Empty

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send Change_Speed command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_change_altitude_command(target_name, pub_topic, target_sys_id, target_alt) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_DO_CHANGE_ALTITUDE;
    btn_params.confirmation = 0;
    btn_params.param1 = target_alt; // Altitude
    btn_params.param2 = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // Frame of new altitude.
    btn_params.param3 = 0; // Empty
    btn_params.param4 = 0; // Empty
    btn_params.param5 = 0; // Empty
    btn_params.param6 = 0; // Empty
    btn_params.param7 = 0; // Empty

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send Change Altitude command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_wp_yaw_behavior_param_set_command(target_name, pub_topic, target_sys_id, value) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "WP_YAW_BEHAVIOR";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_UINT8;
    btn_params.param_value = value;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send WP_YAW_HEHAVIOR param set command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}


function send_wpnav_speed_param_set_command(target_name, pub_topic, target_sys_id, target_speed) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "WPNAV_SPEED";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_REAL32;
    btn_params.param_value = target_speed * 100; // cm / s.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send WPNAV Speed command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_wpnav_speed_dn_param_set_command(target_name, pub_topic, target_sys_id, target_speed) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "WPNAV_SPEED_DN";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_REAL32;
    btn_params.param_value = target_speed * 100; // cm / s.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send WPNAV Speed DN to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_wpnav_speed_up_param_set_command(target_name, pub_topic, target_sys_id, target_speed) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "WPNAV_SPEED_UP";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_REAL32;
    btn_params.param_value = target_speed * 100; // cm / s.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('\nSend WPNAV Speed UP command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

function send_sysid_thismav_param_set_command(target_name, pub_topic, target_sys_id, id_val) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "SYSID_THISMAV";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_UINT8;
    btn_params.param_value = id_val; // cm / s.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send SYSID_THISMAV command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex ) {
        console.log( '[ERROR] ' + ex );
    }
}

var placeFlag = '';
setInterval(function () {
    if(placeFlag === 'startMenu') {
        for (var idx in conf.drone) {
            if (conf.drone.hasOwnProperty(idx)) {
                cur_drone_selected = conf.drone[idx].name;

                var cur_lat = (gpi[target_system_id[cur_drone_selected]].lat / 10000000);
                var cur_lon = (gpi[target_system_id[cur_drone_selected]].lon / 10000000);
                var cur_alt = gpi[target_system_id[cur_drone_selected]].relative_alt / 1000;
                var cur_speed = Math.sqrt(Math.pow(gpi[target_system_id[cur_drone_selected]].vx, 2) + Math.pow(gpi[target_system_id[cur_drone_selected]].vy, 2)) / 100;

                term.moveTo.cyan(1, parseInt(idx, 10) + 2, "[%s] %s:%s:%s:%s", cur_drone_selected, cur_lat.toFixed(7), cur_lon.toFixed(7), cur_alt.toFixed(1), cur_speed.toFixed(1));
            }
        }
    }
}, 1000);

function param_get_command(target_name, pub_topic, target_sys_id, param_id) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = param_id;
    btn_params.param_index = -1;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_REQUEST_READ, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.blue('Send SYSID_THISMAV command to %s\n', target_name);
            term.red('msg: ' +  msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch( ex )      {
        console.log( '[ERROR] ' + ex );
    }
}


var moment = require('moment');

function save_current_position() {
    var cur_pos = {};
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            cur_drone_selected = conf.drone[idx].name;

            cur_pos[cur_drone_selected]
            var cur_lat = (gpi[target_system_id[cur_drone_selected]].lat / 10000000);
            var cur_lon = (gpi[target_system_id[cur_drone_selected]].lon / 10000000);
            var cur_alt = gpi[target_system_id[cur_drone_selected]].relative_alt / 1000;
            var cur_speed = Math.sqrt(Math.pow(gpi[target_system_id[cur_drone_selected]].vx, 2) + Math.pow(gpi[target_system_id[cur_drone_selected]].vy, 2)) / 100;

            cur_pos[cur_drone_selected] = cur_lat + ':' + cur_lon + ':' + cur_alt + ':' + cur_speed;
        }
    }

    var timestamp = moment().format('MM-DD-HH-mm-ss');

    fs.writeFileSync('cur_pos_' + timestamp + '.json', JSON.stringify(cur_pos, null, 4), 'utf8');
}
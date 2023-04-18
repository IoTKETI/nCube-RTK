require('./http_app');
var fs = require('fs');

var mavlink = require('./mavlibrary/mavlink.js');

var term = require('terminal-kit').terminal;

var command_items = ['Back', 'Arm', 'Mode', 'Takeoff', 'GoTo', 'GoTo_Alt', 'GoTo_Circle', 'Hold', 'Change_Speed', 'Land', 'RTL', 'Auto_Mission', 'Start_Mission', 'SET_ROI', 'SET_SERVO', 'SET_RELAY','Follow', 'Params', 'Real_Control'];
var cur_command_items = [];

var params_items = ['Back', 'set_WP_YAW_BEHAVIOR', 'set_WPNAV_SPEED', 'set_WPNAV_SPEED_DN', 'set_ATC_SLEW_YAW', 'set_ACRO_YAW_P', 'set_WPNAV_RADIUS', 'set_CIRCLE_RADIUS', 'set_CIRCLE_RATE', 'set_SERVO_Param', 'set_SYSID_THISMAV', 'Reboot',
    'get_Joystick_Params'];

var follow_items = ['Back', 'set_Follow_Params', 'set_Follow'];

var follow_params_items = ['cancel', '11:10:0:0:10:5', '11:10:10:10:10:5', '11:10:-10:10:10:5'];

const jostick_params = ['RC1_MAX', 'RC1_MIN', 'RC1_TRIM', 'RC2_MAX', 'RC2_MIN', 'RC2_TRIM', 'RC3_MAX', 'RC3_MIN', 'RC3_TRIM', 'RC4_MAX', 'RC4_MIN', 'RC4_TRIM']

var alt_items = ['cancel', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150'];

var interest_items = ['cancel', '37.2724709:127.3633033:35'];

var speed_items = ['cancel', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

var radius_items = ['cancel', '5', '10', '15', '20', '25', '30', '50', '100', '200', '500', '1000', '2000'];

var id_items = ['cancel', 'random', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150', '160'];

var auto_items = ['cancel', '1', '1:3', '2:5', '3:6', '3'];

var options = {
    y: 1,	// the menu will be on the top of the terminal
    style: term.inverse,
    selectedStyle: term.dim.blue.bgGreen
};


var history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var takeoff_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var goto_alt_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var speed_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var roi_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var servo_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var relay_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var mission_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var wpnav_speed_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var wpnav_speed_dn_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var atc_slew_yaw_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var acro_yaw_p_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var wpnav_radius_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var circle_radius_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var circle_rate_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var servo_param_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var sysid_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var follow_params_history = ['John', 'Jack', 'Joey', 'Billy', 'Bob'];
var auto_history = ['1', '1:3', '2:5', '3:6', '3'];

var mode_items = ['cancel', 'STABILIZE', 'ACRO', 'ALT_HOLD', 'AUTO', 'GUIDED', 'LOITER',
    'RTL', 'CIRCLE', 'POSITION', 'LAND', 'OF_LOITER', 'DRIFT', 'RESERVED_12', 'SPORT',
    'FLIP', 'AUTOTUNE', 'POS_HOLD', 'BRAKE', 'THROW', 'AVOID_ADSB', 'GUIDED_NOGPS', 'SAFE_RTL'];
// var mode_items = ['cancel', 'STABILIZE', 'ACRO', 'ALT_HOLD', 'AUTO', 'GUIDED', 'LOITER',
//     'RTL', 'CIRCLE', 'POSITION', 'LAND', 'OF_LOITER', 'AUTOTUNE', 'POS_HOLD', 'SAFE_RTL'];

var goto_position = {};
var goto_all_position = [];
var target_pub_topic = {};

var drone_items = [];
drone_items.push('Quit');
var target_system_id = {};
var goto_all_index = {};
var goto_all_seq = 0;

var follow_mode = {};
var goto_position_selected = [];

for (var idx in conf.drone) {
    if (conf.drone.hasOwnProperty(idx)) {
        drone_items.push(conf.drone[idx].name);
        goto_position[conf.drone[idx].name] = [];
        goto_position[conf.drone[idx].name] = conf.drone[idx].goto_position;
        target_system_id[conf.drone[idx].name] = conf.drone[idx].system_id;
        goto_all_index[conf.drone[idx].name] = goto_all_seq++;

        goto_position_selected[idx] = '0:0:0';

        hb[conf.drone[idx].system_id] = {};
        hb[conf.drone[idx].system_id].base_mode = 0;
        hb[conf.drone[idx].system_id].custom_mode = 0;

        gpi[conf.drone[idx].system_id] = {};
        gpi[conf.drone[idx].system_id].time_boot_ms = 0;
        gpi[conf.drone[idx].system_id].lat = 0;
        gpi[conf.drone[idx].system_id].lon = 0;
        gpi[conf.drone[idx].system_id].alt = 0;
        gpi[conf.drone[idx].system_id].relative_alt = 0;
        gpi[conf.drone[idx].system_id].vx = 0;
        gpi[conf.drone[idx].system_id].vy = 0;

        follow_mode[conf.drone[idx].system_id] = {};
        follow_mode[conf.drone[idx].system_id].foll_enable = 0;
        follow_mode[conf.drone[idx].system_id].foll_sysid = 0;
        follow_mode[conf.drone[idx].system_id].foll_dist_max = 10;
        follow_mode[conf.drone[idx].system_id].foll_ofs_x = 0;
        follow_mode[conf.drone[idx].system_id].foll_ofs_y = 0;
        follow_mode[conf.drone[idx].system_id].foll_ofs_z = 10;
        follow_mode[conf.drone[idx].system_id].foll_pos_p = 5;

        target_pub_topic[conf.drone[idx].name] = '/Mobius/' + conf.drone[idx].gcs + '/GCS_Data/' + conf.drone[idx].name;
    }
}
drone_items.push('All');

term.clear();

var startMenuDroneSelected = 'none';
var cur_goto_position = 'none';
var cur_mode_selected = 'none';

const back_menu_delay = 100;

function sFact(num) {
    var rval = 1;
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

var cur_drone_list_selected = [];

var startMenuIndex = 0;

function startMenu() {
    placeFlag = 'startMenu';
    printFlag = 'enable';

    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.yellow.bgGray,
        selectedIndex: startMenuIndex
    };

    term.singleLineMenu(drone_items, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        startMenuDroneSelected = response.selectedText;
        startMenuIndex = response.selectedIndex;

        //console.log(response.selectedIndex);

        cur_command_items = [].concat(command_items);

        if (startMenuDroneSelected === 'All') {
            cur_drone_list_selected = [].concat(conf.drone);

            cur_command_items.splice(cur_command_items.indexOf('Follow'), 1);
            //cur_command_items.splice(cur_command_items.indexOf('Real_Control'), 1);
        }
        else if (startMenuDroneSelected === 'Quit') {
            process.exit();
        }
        else {
            cur_drone_list_selected = [].concat(conf.drone[startMenuIndex-1]);
        }

        term('\n').eraseDisplayBelow();

        allMenu();
    });
}

var curAllMenuIndex = 0;

function allMenu() {
    placeFlag = 'allMenu';
    printFlag = 'enable';

    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.blue.bgGreen,
        selectedIndex: curAllMenuIndex
    };

    term.singleLineMenu(cur_command_items, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        curAllMenuIndex = response.selectedIndex;

        conf.drone = JSON.parse(fs.readFileSync(drone_info_file, 'utf8'));

        if (startMenuDroneSelected === 'All') {
            cur_drone_list_selected = [].concat(conf.drone);
        }
        else {
            cur_drone_list_selected = [].concat(conf.drone[startMenuIndex-1]);
        }

        if (response.selectedText === 'Back') {
            setTimeout(startMenu, back_menu_delay);
        }
        else if (response.selectedText === 'Arm') {
            allArmMenu();
        }
        else if (response.selectedText === 'Mode') {
            allModeMenu();
        }
        else if (response.selectedText === 'Takeoff') {
            allTakeoffMenu();
        }
        else if (response.selectedText === 'GoTo') {
            allGotoMenu();
        }
        else if (response.selectedText === 'GoTo_Alt') {
            allGotoAltMenu();
        }
        else if (response.selectedText === 'GoTo_Circle') {
            allGotoCircleMenu();
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
        else if (response.selectedText === 'RTL') {
            allRTLMenu();
        }
        else if (response.selectedText === 'Auto_GoTo') {
            allAutoGotoMenu();
        }
        else if (response.selectedText === 'Auto_Mission') {
            allAutoMenu();
        }
        else if (response.selectedText === 'SET_ROI') {
            allSetRoiMenu();
        }
        else if (response.selectedText === 'SET_SERVO') {
            allSetServoMenu();
        }
        else if (response.selectedText === 'SET_RELAY') {
            allSetRelayMenu();
        }
        else if (response.selectedText === 'Start_Mission') {
            allStartMissionMenu();
        }
        else if (response.selectedText === 'Follow') {
            eachFollowMenu();
        }
        else if (response.selectedText === 'Params') {
            allParamsMenu();
        }
        else if (response.selectedText === 'Real_Control') {
            eachRealControlMenu();
        }
        else {
            setTimeout(startMenu, back_menu_delay);
        }
    });
}

function allArmMenu() {
    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, '');

    var command_delay = 0;
    column_count = 3;
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            command_delay++;

            follow_mode[target_system_id[drone_selected]].foll_enable = 0;

            setTimeout(send_arm_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], 1, 0);
        }
    }

    setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
}

function allModeMenu() {
    printFlag = 'disable';

    term('').eraseLineAfter.moveTo(1, 2, "");
    term.eraseDisplayBelow();
    term('Select Mode : ');

    var _options = {
        selectedIndex: 0
    };

    term.singleColumnMenu(mode_items, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        printFlag = 'enable';
        term.eraseDisplayBelow();

        var input = response.selectedText;
        if (input === 'cancel') {
            setTimeout(allMenu, back_menu_delay);
        }
        else {
            cur_mode_selected = input;
            // history.push(input);
            // history.shift();

            var custom_mode = mode_items.indexOf(cur_mode_selected) - 1;
            var command_delay = 0;
            column_count = 3;
            for (var idx in cur_drone_list_selected) {
                if (cur_drone_list_selected.hasOwnProperty(idx)) {
                    var drone_selected = cur_drone_list_selected[idx].name;

                    command_delay++;

                    var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                    base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                    setTimeout(send_set_mode_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);
                }
            }

            setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
        }
    });
}


function allTakeoffMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Height : ');

    term.inputField(
        {history: takeoff_history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                takeoff_history.push(input);
                takeoff_history.shift();

                var arr_input = input.split(':');

                var command_delay = 0;
                column_count = 5;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        follow_mode[target_system_id[drone_selected]].foll_enable = 0;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        setTimeout(send_arm_command, 500 + 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], 1, 0);

                        if(arr_input.hasOwnProperty(idx)) {
                            var alt = parseFloat(arr_input[idx]);
                            if (alt < 2.0) {
                                alt = 2.0;
                            }
                        }
                        else {
                            alt = parseFloat(arr_input[0]);
                        }

                        setTimeout(send_takeoff_command, 6500 + 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], alt);
                    }
                }
                setTimeout(allMenu, 7500 + 50 * (command_delay +1));
            }
        }
    );
}

var cur_goto_position_selected = {};
function actionAllGoto(input) {
    cur_goto_position = input;
    var arr_goto_all_position = cur_goto_position.split('|');

    var command_delay = 0;
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;
            cur_goto_position_selected[drone_selected] = arr_goto_all_position[idx];
            cur_goto_position = arr_goto_all_position[idx];
            command_delay++;

            follow_mode[target_system_id[drone_selected]].foll_enable = 0;

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            setTimeout(send_set_mode_command, 10 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

            var arr_cur_goto_position = cur_goto_position.split(':');
            var lat = parseFloat(arr_cur_goto_position[0]);
            var lon = parseFloat(arr_cur_goto_position[1]);
            var alt = parseFloat(arr_cur_goto_position[2]);
            var speed = parseFloat(arr_cur_goto_position[3]);

            setTimeout(send_goto_command, 50 + 20 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], lat, lon, alt);

            setTimeout(send_change_speed_command, 500 + 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
        }
    }
}

function actionAllGotoCircle(input) {
    cur_goto_position = input;
    var arr_goto_all_position = cur_goto_position.split('|');

    var command_delay = 0;
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;
            cur_goto_position_selected[drone_selected] = arr_goto_all_position[idx];
            cur_goto_position = arr_goto_all_position[idx];
            command_delay++;

            follow_mode[target_system_id[drone_selected]].foll_enable = 0;

            var arr_cur_goto_position = cur_goto_position.split(':');
            var lat = parseFloat(arr_cur_goto_position[0]);
            var lon = parseFloat(arr_cur_goto_position[1]);
            var alt = parseFloat(arr_cur_goto_position[2]);
            var speed = parseFloat(arr_cur_goto_position[3]);

            if(arr_cur_goto_position.hasOwnProperty('4')) {
                var radius = parseFloat(arr_cur_goto_position[4]);
            }
            else { // default radius
                radius = 20;
            }

            if(arr_cur_goto_position.hasOwnProperty('5')) {
                var circle_speed = parseFloat(arr_cur_goto_position[5]);
            }
            else {
                circle_speed = speed;
            }

            setTimeout(send_circle_radius_param_set_command, 15 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], radius);

            var degree_speed = parseInt((circle_speed / radius) * (180 / 3.14), 10);
            setTimeout(send_circle_rate_param_set_command, 200 + 15 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], degree_speed);

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            setTimeout(send_set_mode_command, 400 + 15 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

            setTimeout(send_goto_circle_command, 600 + 100 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], lat, lon, alt, speed, radius);
        }
    }
}

var curAllGotoIndex = 0;

function allGotoMenu() {
    placeFlag = 'allGotoMenu';
    printFlag = 'disable';

    term('').eraseLineAfter.moveTo(1, 2, "");
    term.eraseDisplayBelow();
    term('Select Position : ');

    var _options = {
        selectedIndex: curAllGotoIndex
    };

    goto_all_position = [];
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            for (var i in cur_drone_list_selected[idx].goto_position) {
                if (cur_drone_list_selected[idx].goto_position.hasOwnProperty(i)) {
                    if (goto_all_position[i] == undefined) {
                        goto_all_position[i] = '';
                    }
                    goto_all_position[i] += (cur_drone_list_selected[idx].goto_position[i] + '|');

                }
            }
        }
    }

    term.singleColumnMenu(goto_all_position, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        printFlag = 'enable';
        term.eraseDisplayBelow();

        curAllGotoIndex = response.selectedIndex;
        var input = response.selectedText;
        if (input.split('|')[0] === 'cancel') {
            setTimeout(allMenu, back_menu_delay);
        }
        else {
            // history.push(input);
            // history.shift();

            column_count = 3;
            actionAllGoto(input);

            setTimeout(allMenu, 1000 + 50 * (cur_drone_list_selected.length + 1));
        }
    });
}


function allGotoAltMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Altitude : ');

    term.inputField(
        {history: goto_alt_history, autoComplete: alt_items, autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                goto_alt_history.push(input);
                goto_alt_history.shift();

                var arr_input = input.split(':');

                var command_delay = 0;
                column_count = 5;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        follow_mode[target_system_id[drone_selected]].foll_enable = 0;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        if(arr_input.hasOwnProperty(idx)) {
                            var alt = parseFloat(arr_input[idx]);
                        }
                        else {
                            alt = parseFloat(arr_input[0]);
                        }

                        setTimeout(send_goto_alt_command, 500 + 50 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], alt);
                    }
                }

                setTimeout(allMenu, 1000 + 50 * (cur_drone_list_selected.length + 1));
            }
        }
    );
}


var curAllGotoCircleIndex = 0;

function allGotoCircleMenu() {
    placeFlag = 'allGotoCircleMenu';
    printFlag = 'disable';

    term('').eraseLineAfter.moveTo(1, 2, "");
    term.eraseDisplayBelow();
    term('Select Position : ');

    var _options = {
        selectedIndex: curAllGotoCircleIndex
    };

    goto_all_position = [];
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            for (var i in cur_drone_list_selected[idx].goto_position) {
                if (cur_drone_list_selected[idx].goto_position.hasOwnProperty(i)) {
                    if (goto_all_position[i] == undefined) {
                        goto_all_position[i] = '';
                    }
                    goto_all_position[i] += (cur_drone_list_selected[idx].goto_position[i] + '|');
                }
            }
        }
    }

    term.singleColumnMenu(goto_all_position, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        printFlag = 'enable';
        term.eraseDisplayBelow();

        curAllGotoCircleIndex = response.selectedIndex;
        var input = response.selectedText;
        if (input.split('|')[0] === 'cancel') {
            setTimeout(allMenu, back_menu_delay);
        }
        else {
            // history.push(input);
            // history.shift();

            column_count = 3;
            actionAllGotoCircle(input);

            setTimeout(allMenu, 4000);
        }
    });
}

const unit_gap = 1000;

function allChangeSpeedMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Speed (1 - 12 (m/s)): ');

    term.inputField(
        {history: speed_history, autoComplete: speed_items, autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.green(
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                speed_history.push(input);
                speed_history.shift();

                var speed = parseFloat(input);

                if (speed > 12.0) {
                    speed = 12.0;
                }

                if (speed < 1) {
                    speed = 1.0
                }

                var command_delay = 0;
                column_count = 5;
                var max_gap = 0;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        send_set_mode_command(drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        var cur_speed = Math.abs(Math.sqrt((gpi[target_system_id[drone_selected]].vx / 100) * (gpi[target_system_id[drone_selected]].vx / 100) + (gpi[target_system_id[drone_selected]].vy / 100) * (gpi[target_system_id[drone_selected]].vy / 100)));
                        cur_speed = Math.round(cur_speed);
                        var gap_count = 0;
                        if (cur_speed > speed) {
                            gap_count = 0;
                            for (var i = cur_speed - 1; i > speed; i--) {
                                setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], i);
                                gap_count++;
                            }
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                        }
                        else if (cur_speed < speed) {
                            gap_count = 0;
                            for (i = cur_speed + 1; i < speed; i++) {
                                setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], i);
                                gap_count++;
                            }
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                        }
                        else {
                            gap_count = 0;
                            setTimeout(send_change_speed_command, back_menu_delay * command_delay + (unit_gap * gap_count), drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                        }

                        if (max_gap < gap_count) {
                            max_gap = gap_count;
                        }
                    }
                }

                setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1) + (unit_gap * max_gap));
            }
        }
    );
}

function allHoldMenu() {
    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, '');

    var command_delay = 0;
    column_count = 3;
    for (idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            command_delay++;

            follow_mode[target_system_id[drone_selected]].foll_enable = 0;

            // // set BRAKE Mode
            // var custom_mode = 17;
            // set POS_HOLD Mode
            var custom_mode = 16;
            var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            setTimeout(send_set_mode_command, command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);
       }
    }

    setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
}

function allLandMenu() {
    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, '');

    var command_delay = 0;
    column_count = 3;
    for (idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            command_delay++;
            setTimeout(send_land_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected]);
        }
    }

    setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
}

function allRTLMenu() {
    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, '');

    var command_delay = 0;
    column_count = 3;
    for (idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            command_delay++;
            setTimeout(send_rtl_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected]);
        }
    }

    setTimeout(allMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
}

var key = '';
const map = new Map();
map.set('w', 'throttle_high');
map.set('a', 'yaw_left');
map.set('s', 'throttle_low');
map.set('d', 'yaw_right');
map.set('UP', 'pitch_forward');
map.set('LEFT', 'roll_left');
map.set('DOWN', 'pitch_backward');
map.set('RIGHT', 'roll_right');
// map.set('w', 'pitch_forward');
// map.set('a', 'roll_left');
// map.set('s', 'pitch_backward');
// map.set('d', 'roll_right');
map.set('9', 'alt_hold');
map.set('7', 'loiter');

const MAX_OFFSET = 128;
const gap = 16;

term.grabInput();

term.on('key', function (name, matches, data) {
    //console.log( "'key' event:" , name ) ;

    key = name;

    // Detect CTRL-C and exit 'manually'
    if (name === 'CTRL_C') {
        process.exit();
    }

    if (placeFlag === 'eachRealControlMenu') {
        if (map.has(name)) {
            const command = map.get(name);

            if(command === 'loiter') {
                var command_delay = 0;
                column_count = conf.drone.length + conf.drone.length + 14;
                var custom_mode = 5; // LOITER Mode
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, command_delay*10, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);
                    }
                }
            }
            else if(command === 'alt_hold') {
                command_delay = 0;
                column_count = conf.drone.length + conf.drone.length + 14;
                custom_mode = 2; // ALT_HOLD Mode
                for (idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, command_delay*10, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);
                    }
                }
            }
            else if (command === 'throttle_low') {
                throttle_offset += gap;
                if (throttle_offset >= (MAX_OFFSET*2)) {
                    throttle_offset = (MAX_OFFSET*2);
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 13, 'throttle: ' + throttle_offset);
            }
            else if (command === 'throttle_high') {
                throttle_offset -= gap;
                if (throttle_offset <= -(MAX_OFFSET*2)) {
                    throttle_offset = -(MAX_OFFSET*2);
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 13, 'throttle: ' + throttle_offset);
            }
            else if (command === 'yaw_left') {
                yaw_offset -= gap;
                if (yaw_offset <= -MAX_OFFSET) {
                    yaw_offset = -MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 14, 'yaw: ' + yaw_offset);
            }
            else if (command === 'yaw_right') {
                yaw_offset += gap;
                if (yaw_offset >= MAX_OFFSET) {
                    yaw_offset = MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 14, 'yaw: ' + yaw_offset);
            }
            else if (command === 'pitch_forward') {
                pitch_offset -= gap;
                if (pitch_offset <= -MAX_OFFSET) {
                    pitch_offset = -MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 15, 'pitch: ' + pitch_offset);
            }
            else if (command === 'pitch_backward') {
                pitch_offset += gap;
                if (pitch_offset >= MAX_OFFSET) {
                    pitch_offset = MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 15, 'pitch: ' + pitch_offset);
            }
            else if (command === 'roll_left') {
                roll_offset -= gap;
                if (roll_offset <= -MAX_OFFSET) {
                    roll_offset = -MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 16, 'roll: ' + roll_offset);
            }
            else if (command === 'roll_right') {
                roll_offset += gap;
                if (roll_offset >= MAX_OFFSET) {
                    roll_offset = MAX_OFFSET;
                }
                // term.moveTo.eraseLine.cyan(1, conf.drone.length + 16, 'roll: ' + roll_offset);
            }

            clearTimeout(keytimeout);
            keytimeout = setTimeout(key_release, 500);
        }
        else {
            // console.log(`${name} is not defined as a key mapping.`);
        }
    }
});

var keytimeout = setTimeout(key_release, 250);

function key_release() {
    if (placeFlag === 'eachRealControlMenu') {
        if (throttle_offset > 0) {
            throttle_offset -= (gap*4);
            if (throttle_offset < 0) {
                throttle_offset = 0;
            }
        }
        else if (throttle_offset < 0) {
            throttle_offset += (gap*4);
            if (throttle_offset > 0) {
                throttle_offset = 0;
            }
        }

        if (yaw_offset > 0) {
            yaw_offset -= (gap*4);
            if (yaw_offset < 0) {
                yaw_offset = 0;
            }
        }
        else if (yaw_offset < 0) {
            yaw_offset += (gap*4);
            if (yaw_offset > 0) {
                yaw_offset = 0;
            }
        }

        if (pitch_offset > 0) {
            pitch_offset -= (gap*4);
            if (pitch_offset < 0) {
                pitch_offset = 0;
            }
        }
        else if (pitch_offset < 0) {
            pitch_offset += (gap*4);
            if (pitch_offset > 0) {
                pitch_offset = 0;
            }
        }

        if (roll_offset > 0) {
            roll_offset -= (gap*4);
            if (roll_offset < 0) {
                roll_offset = 0;
            }
        }
        else if (roll_offset < 0) {
            roll_offset += (gap*4);
            if (roll_offset > 0) {
                roll_offset = 0;
            }
        }

        if (roll_offset == 0 && pitch_offset == 0 && throttle_offset == 0 && yaw_offset == 0) {
        }
        else {
            setTimeout(key_release, 100);
        }
    }
}

var ori_dist = 0;
var cur_dist = 0;

function calcAllDistance(goto_position) {
    var dist = 0;
    var arr_goto_all_position = goto_position.split('|');
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;
            cur_goto_position = arr_goto_all_position[idx];

            var cur_lat = gpi[target_system_id[drone_selected]].lat / 10000000;
            var cur_lon = gpi[target_system_id[drone_selected]].lon / 10000000;
            var cur_alt = gpi[target_system_id[drone_selected]].relative_alt / 1000;

            var result1 = dfs_xy_conv('toXY', cur_lat, cur_lon);

            var arr_cur_goto_position = cur_goto_position.split(':');
            var tar_lat = parseFloat(arr_cur_goto_position[0]);
            var tar_lon = parseFloat(arr_cur_goto_position[1]);
            var tar_alt = parseFloat(arr_cur_goto_position[2]);

            var result2 = dfs_xy_conv('toXY', tar_lat, tar_lon);

            dist += Math.sqrt(Math.pow(result2.x - result1.x, 2) + Math.pow(result2.y - result1.y, 2) + Math.pow((tar_alt - cur_alt), 2));
        }
    }

    return dist;
}

var pre_progress = 0;
var abnormal_count = 0;

function doAllProgress(selectedIndex, input, callback) {
    if (key === 'BACKSPACE') {
        key = '';
        progress = 1;
        progressBar.update(progress);

        callback('404');
    }
    else {
        cur_dist = calcAllDistance(input);

        progress = (ori_dist - cur_dist) / ori_dist;
        if (progress > 0.96) {
            progress = 1;
        }
        progressBar.update(progress);

        if (progress >= 1) {
            setTimeout(callback, 900, '200');
        }
        else if (Math.abs(pre_progress - progress) < 0.0001) {
            pre_progress = progress;
            abnormal_count++;
            if (abnormal_count > 16) {
                progress = 1;
                progressBar.update(progress);
                callback('500');
            }
            else {
                setTimeout(doAllProgress, 100 + Math.random() * 400, selectedIndex, input, function (code) {
                    callback(code);
                });
            }
        }
        else {
            pre_progress = progress;
            cur_dist = 0;
            setTimeout(doAllProgress, 100 + Math.random() * 400, selectedIndex, input, function (code) {
                callback(code);
            });
        }
    }
}

function actionAllProgressBar(selectedIndex, input) {
    progressBar = term.moveTo(1, conf.drone.length + column_count).progressBar({
        width: 80,
        title: 'In flight:',
        eta: true,
        percent: true
    });

    ori_dist = calcAllDistance(input);
    cur_dist = 0;
    abnormal_count = 0;

    progress = 0;
    doAllProgress(selectedIndex, input, function (code) {
        if (code === '404') {
            term.moveTo.eraseDisplayBelow.red(1, conf.drone.length + column_count, 'Canceled\n');
            setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
        }
        else if (code === '500') {
            term.moveTo.eraseDisplayBelow.red(1, conf.drone.length + column_count, 'Drone is no response\n');
            setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
        }
        else {
            if (++selectedIndex >= goto_all_position.length) {
                setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
            }
            else {
                // todo: 목적지에 도달한 뒤 대기 시간 기다리는 것 추가할 것, 개별 드론별 대기시간 주는 건 어려울 듯

                setTimeout(actionAllAutoGoto, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1), selectedIndex);
            }
        }
    });
}


var progress = 0;
var progressBar = null;

function actionAllAutoGoto(selectedGotoIndex) {
    curAllAutoGotoIndex = selectedGotoIndex;
    var input = goto_all_position[selectedGotoIndex];

    term('\n').moveTo.eraseLineAfter.green(1, conf.drone.length + 3, "%d : %s\n", selectedGotoIndex, input);

    column_count = 4;
    actionAllGoto(input);

    setTimeout(actionAllProgressBar, 1000 + back_menu_delay * (cur_drone_list_selected.length + 1), selectedGotoIndex, input);
}

var curAllAutoGotoIndex = 0;

function actionAllAuto(goto_all_position, input) {
    var arr_auto_info = input.split(':');
    var start_idx = parseInt(arr_auto_info[0]);

    if(arr_auto_info.hasOwnProperty('1')) {
        var end_idx = parseInt(arr_auto_info[1]);
    }
    else { // default end_idx is last
        end_idx = goto_all_position.length - 1;
    }

    if(arr_auto_info.hasOwnProperty('2')) {
        var delay = parseInt(arr_auto_info[2]);
    }
    else { // default delay is 2 seconds
        delay = 2;
    }

    var command_delay = 0;
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            // set GUIDED Mode
            var custom_mode = 4;
            var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
            setTimeout(send_set_mode_command, 400 + 15 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

            setTimeout(send_auto_command, 600 + 100 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], cur_drone_list_selected[idx].goto_position, start_idx, end_idx, delay, start_idx);
        }
    }
}

function allAutoMenu() {
    placeFlag = 'allAutoMenu';
    printFlag = 'disable';

    goto_all_position = [];
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            for (var i in cur_drone_list_selected[idx].goto_position) {
                if (cur_drone_list_selected[idx].goto_position.hasOwnProperty(i)) {
                    if (goto_all_position[i] == undefined) {
                        goto_all_position[i] = '';
                    }
                    goto_all_position[i] += (cur_drone_list_selected[idx].goto_position[i] + '|');
                }
            }
        }
    }

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Mission Index ([start]:[end]:[delay]): ');

    term.inputField(
        {history: auto_history, autoComplete: auto_items, autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                auto_history.push(input);
                auto_history.shift();

                column_count = 3;
                actionAllAuto(goto_all_position, input);

                setTimeout(allMenu, 4000);
            }
        }
    );
}

function allAutoGotoMenu() {
    placeFlag = 'allAutoGotoMenu';
    printFlag = 'disable';

    term('').eraseLineAfter.moveTo(1, 2, "");
    term.eraseDisplayBelow();
    term('Select Start Position : ');

    var _options = {
        selectedIndex: curAllAutoGotoIndex
    };

    goto_all_position = [];
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            for (var i in cur_drone_list_selected[idx].goto_position) {
                if (cur_drone_list_selected[idx].goto_position.hasOwnProperty(i)) {
                    if (goto_all_position[i] == undefined) {
                        goto_all_position[i] = '';
                    }
                    goto_all_position[i] += (cur_drone_list_selected[idx].goto_position[i] + '|');
                }
            }
        }
    }

    term.singleColumnMenu(goto_all_position, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        printFlag = 'enable';
        term.eraseDisplayBelow();

        curAllAutoGotoIndex = response.selectedIndex;
        var input = response.selectedText;
        if (input.split('|')[0] === 'cancel') {
            setTimeout(allMenu, back_menu_delay);
        }
        else {
            // history.push(input);
            // history.shift();

            column_count = 3;
            actionAllAutoGoto(curAllAutoGotoIndex);
        }
    });
}

function allSetRoiMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Interest ([lat]:[lon]:[alt]): ');

    term.inputField(
        {history: roi_history, autoComplete: interest_items, autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                roi_history.push(input);
                roi_history.shift();

                var arr_cur_interest_lat = input.split(':');
                var lat = parseFloat(arr_cur_interest_lat[0]);
                var lon = parseFloat(arr_cur_interest_lat[1]);
                var alt = parseFloat(arr_cur_interest_lat[2]);

                var command_delay = 0;
                column_count = 5;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        follow_mode[target_system_id[drone_selected]].foll_enable = 0;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        setTimeout(send_set_roi_command, back_menu_delay + (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], lat, lon, alt);
                    }
                }
                setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
            }
        }
    );
}

function allSetServoMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Number ([Number]:[PWM]): ');

    term.inputField(
        {history: servo_history, autoComplete: ['cancel', '0:1500', '1:1800', '2:1000', '3:800', '4:1200', '5:1200', '6:1200', '7:1200'], autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                servo_history.push(input);
                servo_history.shift();

                var arr_servo = input.split(':');
                var number = parseFloat(arr_servo[0]);
                var pwm = parseFloat(arr_servo[1]);

                var command_delay = 0;
                column_count = 5;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        follow_mode[target_system_id[drone_selected]].foll_enable = 0;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        setTimeout(send_set_servo_command, back_menu_delay + (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, pwm);
                    }
                }
                setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
            }
        }
    );
}

function allSetRelayMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Number ([Number]:[val]): ');

    term.inputField(
        {history: relay_history, autoComplete: ['cancel', '0:1', '1:1', '2:0', '3:0', '4:1'], autoCompleteMenu: true},
        function (error, input) {
            term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                "%s selected\n",
                input
            );

            printFlag = 'enable';

            if (input === 'cancel') {
                setTimeout(allMenu, back_menu_delay);
            }
            else {
                relay_history.push(input);
                relay_history.shift();

                var arr_relay = input.split(':');
                var number = parseFloat(arr_relay[0]);
                var val = parseFloat(arr_relay[1]);

                var command_delay = 0;
                column_count = 5;
                for (var idx in cur_drone_list_selected) {
                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                        var drone_selected = cur_drone_list_selected[idx].name;

                        command_delay++;

                        follow_mode[target_system_id[drone_selected]].foll_enable = 0;

                        var custom_mode = 4;
                        var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                        setTimeout(send_set_mode_command, (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                        setTimeout(send_set_relay_command, back_menu_delay + (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, val);
                    }
                }
                setTimeout(allMenu, back_menu_delay + back_menu_delay * (cur_drone_list_selected.length + 1));
            }
        }
    );
}

function allStartMissionMenu() {
    printFlag = 'disable';

    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, 'Select Start Number: ');

    term.inputField(
    {history: mission_history, autoComplete: ['cancel', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], autoCompleteMenu: true}, function (error, input) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
            "%s selected\n",
            input
        );

        printFlag = 'enable';

        if (input === 'cancel') {
            setTimeout(allMenu, back_menu_delay);
        }
        else {
            mission_history.push(input);
            mission_history.shift();

            var start_number = parseInt(input, 10);

            column_count = 5;
            var command_delay = 0;
            for (idx in cur_drone_list_selected) {
                if (cur_drone_list_selected.hasOwnProperty(idx)) {
                    var drone_selected = cur_drone_list_selected[idx].name;

                    command_delay++;

                    if (hb.hasOwnProperty(target_system_id[drone_selected])) {
                        if (hb[target_system_id[drone_selected]].base_mode & 0x80) {
                            setTimeout(send_start_mission_command, 20 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], start_number, 10);
                        }
                        else {
                            setTimeout(send_arm_command, 20 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], 1, 0);

                            setTimeout(send_start_mission_command, 6000 + 20 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], start_number, 10);
                        }
                    }
                }
            }

            setTimeout(allMenu, 6500 + back_menu_delay * (cur_drone_list_selected.length + 1));
        }
    });
}

function result_all_param_get_command() {
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;
            if(rc1_max.hasOwnProperty(target_system_id[drone_selected])) {
                for (var param_idx in jostick_params) {
                    if (jostick_params.hasOwnProperty(param_idx)) {
                        var target = jostick_params[param_idx];

                        if (target === 'RC1_MAX') {
                            var cur_param_value = rc1_max[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC1_MIN') {
                            cur_param_value = rc1_min[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC1_TRIM') {
                            cur_param_value = rc1_trim[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC2_MAX') {
                            cur_param_value = rc2_max[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC2_MIN') {
                            cur_param_value = rc2_min[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC2_TRIM') {
                            cur_param_value = rc2_trim[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC3_MAX') {
                            cur_param_value = rc3_max[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC3_MIN') {
                            cur_param_value = rc3_min[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC3_TRIM') {
                            cur_param_value = rc3_trim[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC4_MAX') {
                            cur_param_value = rc4_max[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC4_MIN') {
                            cur_param_value = rc4_min[target_system_id[drone_selected]].param_value;
                        }
                        else if (target === 'RC4_TRIM') {
                            cur_param_value = rc4_trim[target_system_id[drone_selected]].param_value;
                        }
                        term.moveTo.cyan(1, parseInt(idx, 10) * jostick_params.length + 2 + parseInt(param_idx, 10), "                                                                        ");
                        term.moveTo.cyan(1, parseInt(idx, 10) * jostick_params.length + 2 + parseInt(param_idx, 10), "%s [%s] %s", target, drone_selected, cur_param_value);
                    }
                }
            }
        }
    }

    setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
}

var curAllParamsMenuIndex = 0;

function allParamsMenu() {
    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.white.bgBlue,
        selectedIndex: curAllParamsMenuIndex
    };

    term.singleLineMenu(params_items, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        curAllParamsMenuIndex = response.selectedIndex;

        if (response.selectedText === 'Back') {
            setTimeout(allMenu, back_menu_delay);
        }
        else if (response.selectedText === 'set_WP_YAW_BEHAVIOR') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Value: ');
            term.eraseDisplayBelow();

            term.singleColumnMenu(['cancel', '0: Never change yaw', '1: Face next waypoint', '2: Face next waypoint except RTL', '3: Face along GPS course'], function (error, response) {
                term('\n').moveTo.eraseDisplayBelow.green(1, conf.drone.length + 4,
                    "#%s selected: %s (%s,%s)\n",
                    response.selectedIndex,
                    response.selectedText,
                    response.x,
                    response.y
                );

                var input = response.selectedText;
                if (input === 'cancel') {
                    setTimeout(allParamsMenu, back_menu_delay);
                }
                else {
                    // history.push(input);
                    // history.shift();

                    var param_value = parseInt(response.selectedIndex, 10) - 1;

                    if (param_value > 3) {
                        param_value = 3;
                    }

                    if (param_value < 0) {
                        param_value = 0
                    }

                    console.log(param_value);

                    column_count = 5;

                    var command_delay = 0;
                    for (var idx in cur_drone_list_selected) {
                        if (cur_drone_list_selected.hasOwnProperty(idx)) {
                            var drone_selected = cur_drone_list_selected[idx].name;

                            command_delay++;

                            setTimeout(send_wp_yaw_behavior_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], param_value);
                        }
                    }

                    setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                }

                printFlag = 'enable';
            });
        }
        else if (response.selectedText === 'set_WPNAV_SPEED') {
            printFlag = 'disable';

            term.eraseDisplayBelow();
            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Speed (1 - 12 (m/s)): ');

            term.inputField(
                {history: wpnav_speed_history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        wpnav_speed_history.push(input);
                        wpnav_speed_history.shift();

                        var speed = parseFloat(input);

                        if (speed > 12.0) {
                            speed = 12.0;
                        }

                        if (speed < 1) {
                            speed = 1.0
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_wpnav_speed_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_WPNAV_SPEED_DN') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Speed (1 - 12 (m/s)): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: wpnav_speed_dn_history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        wpnav_speed_dn_history.push(input);
                        wpnav_speed_dn_history.shift();

                        var speed = parseFloat(input);

                        if (speed > 12.0) {
                            speed = 12.0;
                        }

                        if (speed < 1) {
                            speed = 1.0
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_wpnav_speed_dn_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_ATC_SLEW_YAW') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select YAW Rate (centidegrees pre second (5 - 180)): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: atc_slew_yaw_history, autoComplete: ['cancel', '5', '10', '15', '20', '25', '50', '100', '180'], autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        atc_slew_yaw_history.push(input);
                        atc_slew_yaw_history.shift();

                        var yaw_speed = parseFloat(input);

                        if (yaw_speed > 180) {
                            yaw_speed = 180;
                        }

                        if (yaw_speed < 5) {
                            yaw_speed = 5
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_atc_slew_yaw_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], yaw_speed);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_ACRO_YAW_P') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Gain (1 - 10): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: acro_yaw_p_history, autoComplete: ['cancel', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        acro_yaw_p_history.push(input);
                        acro_yaw_p_history.shift();

                        var gain = parseFloat(input);

                        if (gain > 10.0) {
                            gain = 10.0;
                        }

                        if (gain < 1) {
                            gain = 1.0
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_acro_yaw_p_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], gain);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_WPNAV_RADIUS') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Value (cm): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: wpnav_radius_history, autoComplete: ['cancel', '50', '100', '150', '200', '250', '300'], autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        wpnav_radius_history.push(input);
                        wpnav_radius_history.shift();

                        var r = parseFloat(input);

                        if (r > 1000.0) {
                            r = 1000.0;
                        }

                        if (r < 5) {
                            r = 50
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_wpnav_radius_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], r);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_CIRCLE_RADIUS') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Radius of Circle (5 - 2000 (m)): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: circle_radius_history, autoComplete: radius_items, autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        circle_radius_history.push(input);
                        circle_radius_history.shift();

                        var radius = parseFloat(input);

                        if (radius > 2000.0) {
                            radius = 2000.0;
                        }

                        if (radius < 5) {
                            radius = 5.0
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_circle_radius_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], radius);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_CIRCLE_RATE') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select Angular Speed (-90 ~ 90 (rad/s)): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: circle_rate_history, autoComplete: speed_items, autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        circle_rate_history.push(input);
                        circle_rate_history.shift();

                        var speed = parseFloat(input);

                        if (speed > 90.0) {
                            speed = 90.0;
                        }

                        if (speed < -90) {
                            speed = -90.0
                        }

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_circle_rate_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_SERVO_Param') {
            printFlag = 'disable';

            term.eraseLineAfter.moveTo.red(1, conf.drone.length + 3, 'Select Servo([number]:[val]): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: servo_param_history, autoComplete: ['cancel', '9:0', '9:51', '9:52', '9:52', '9:53', '9:54', '9:55', '9:56', '9:57', '9:58', '9:59', '9:60', '9:61', '9:62', '9:63', '9:64', '9:65', '9:66'], autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    servo_param_history.push(input);
                    servo_param_history.shift();

                    if (input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {

                        var arr_input = input.split(':');
                        var number = arr_input[0];
                        var val = arr_input[1];

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_servo_param_set_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, val);
                            }
                        }

                        setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'set_SYSID_THISMAV') {
            printFlag = 'disable';

            term.eraseDisplayBelow();

            if(cur_drone_list_selected.length > 1) {
                term('').eraseLineAfter.moveTo.red(1, conf.drone.length + 3, 'Changing sys_id here is not supported');
                setTimeout(allParamsMenu, back_menu_delay);
            }
            else {
                term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Select id (random, 10 - 250): ');

                term.inputField(
                    {history: sysid_history, autoComplete: id_items, autoCompleteMenu: true},
                    function (error, input) {
                        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                            "%s selected\n",
                            input
                        );

                        if (input === 'cancel') {
                            setTimeout(allParamsMenu, back_menu_delay);
                        }
                        else {
                            sysid_history.push(input);
                            sysid_history.shift();

                            if (input === 'random') {
                                var id_val = parseInt(10 + Math.random() * 250, 10);
                            }
                            else {
                                id_val = parseInt(input, 10);
                            }

                            if (id_val > 250) {
                                term.red('id is out of range.\n');
                                setTimeout(allParamsMenu, back_menu_delay);
                            }
                            else if (id_val < 10) {
                                term.red('id is out of range.\n');
                                setTimeout(allParamsMenu, back_menu_delay);
                            }
                            else {
                                term.red('The selected id is %d\n', id_val);

                                column_count = 5;

                                var command_delay = 0;
                                for (idx in cur_drone_list_selected) {
                                    if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                        var drone_selected = cur_drone_list_selected[idx].name;

                                        command_delay++;

                                        setTimeout(send_sysid_thismav_param_set_command, back_menu_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], id_val);

                                        for (var i in conf.drone) {
                                            if (conf.drone.hasOwnProperty(i)) {
                                                if (drone_selected === conf.drone[i].name) {
                                                    conf.drone[i].system_id = id_val;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                fs.writeFileSync(drone_info_file, JSON.stringify(conf.drone, null, 4), 'utf8');

                                setTimeout(allParamsMenu, back_menu_delay * (cur_drone_list_selected.length + 1));
                            }
                        }

                        printFlag = 'enable';
                    }
                );
            }
        }
        else if (response.selectedText === 'Reboot') {
            printFlag = 'disable';

            term('').eraseLineAfter.moveTo(1, conf.drone.length + 3, 'Are you sure? (Y / N): ');
            term.eraseDisplayBelow();

            term.inputField(
                {history: history, autoComplete: ['cancel', 'Y', 'N'], autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n",
                        input
                    );

                    if (input.toLowerCase() === 'n' || input === 'cancel') {
                        setTimeout(allParamsMenu, back_menu_delay);
                    }
                    else {
                        history.push(input);
                        history.shift();

                        column_count = 5;

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                setTimeout(send_reboot_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected]);
                            }
                        }
                        setTimeout(allParamsMenu, back_menu_delay * command_delay + back_menu_delay);
                    }

                    printFlag = 'enable';
                }
            );
        }
        else if (response.selectedText === 'get_Joystick_Params') {
            printFlag = 'disable';

            term.eraseDisplayBelow();

            column_count = 3;

            var command_delay = 0;
            for (var idx in cur_drone_list_selected) {
                if (cur_drone_list_selected.hasOwnProperty(idx)) {
                    var drone_selected = cur_drone_list_selected[idx].name;

                    for (var param_idx in jostick_params) {
                        if (jostick_params.hasOwnProperty(param_idx)) {
                            command_delay++;
                            setTimeout(send_param_get_command, back_menu_delay * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], jostick_params[param_idx]);
                        }
                    }
                }
            }

            setTimeout(result_all_param_get_command, 3000 + back_menu_delay * command_delay);

            printFlag = 'enable';
        }
        else {
            setTimeout(allParamsMenu, back_menu_delay);
        }
    });
}

var curEachFollowMenuIndex = 0;

function eachFollowMenu() {
    term.eraseDisplayBelow();
    term.moveTo.red(1, conf.drone.length + 3, '');

    var _options = {
        y: 1,	// the menu will be on the top of the terminal
        style: term.inverse,
        selectedStyle: term.dim.white.bgBlue,
        selectedIndex: curEachFollowMenuIndex
    };

    term.singleLineMenu(follow_items, _options, function (error, response) {
        term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 2,
            "#%s selected: %s (%s,%s)\n",
            response.selectedIndex,
            response.selectedText,
            response.x,
            response.y
        );

        curEachFollowMenuIndex = response.selectedIndex;

        if (response.selectedText === 'Back') {
            setTimeout(allMenu, back_menu_delay);
        }
        else if (response.selectedText === 'set_Follow_Params') {

            printFlag = 'disable';

            term.eraseDisplayBelow();
            term.moveTo.red(1, conf.drone.length + 3, 'Input Scripts ([sysid]:[dis_max]:[ofs_x]:[ofs_y]:[ofs_z]:[pos_p]): ');

            term.inputField(
                {history: follow_params_history, autoComplete: follow_params_items, autoCompleteMenu: true},
                function (error, input) {
                    term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                        "%s selected\n", input);

                    printFlag = 'enable';

                    if (input === 'cancel') {
                        setTimeout(eachFollowMenu, back_menu_delay);
                    }
                    else {
                        follow_params_history.push(input);
                        follow_params_history.shift();

                        var arr_cur_follow_params = input.split(':');

                        var command_delay = 0;
                        for (var idx in cur_drone_list_selected) {
                            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                                var drone_selected = cur_drone_list_selected[idx].name;

                                command_delay++;

                                if(arr_cur_follow_params[0] == target_system_id[drone_selected]) {
                                    term.red("target sysid for following is not same");
                                }
                                else {
                                    follow_mode[target_system_id[drone_selected]].foll_sysid = parseInt(arr_cur_follow_params[0]);
                                    follow_mode[target_system_id[drone_selected]].foll_dist_max = parseFloat(arr_cur_follow_params[1]);
                                    follow_mode[target_system_id[drone_selected]].foll_ofs_x = parseFloat(arr_cur_follow_params[2]);
                                    follow_mode[target_system_id[drone_selected]].foll_ofs_y = parseFloat(arr_cur_follow_params[3]);
                                    follow_mode[target_system_id[drone_selected]].foll_ofs_z = parseFloat(arr_cur_follow_params[4]);
                                    follow_mode[target_system_id[drone_selected]].foll_pos_p = parseFloat(arr_cur_follow_params[5]);

                                    term.eraseLineAfter.moveTo.green(1, conf.drone.length + 5, '');
                                    console.log(follow_mode[target_system_id[drone_selected]])
                                }
                            }
                        }

                        setTimeout(eachFollowMenu, back_menu_delay * 2);
                    }
                }
            );
        }
        else if (response.selectedText === 'set_Follow') {
            printFlag = 'disable';

            term.eraseDisplayBelow();
            term.moveTo.red(1, conf.drone.length + 3, 'Select Value: ');

            term.singleColumnMenu(['cancel', '0: disable', '1: enable'], function (error, response) {
                term('\n').eraseLineAfter.moveTo.green(1, conf.drone.length + 4,
                    "#%s selected: %s (%s,%s)\n",
                    response.selectedIndex,
                    response.selectedText,
                    response.x,
                    response.y
                );

                printFlag = 'enable';

                var input = response.selectedText;
                if (input === 'cancel') {
                    setTimeout(eachFollowMenu, back_menu_delay);
                }
                else {
                    // history.push(input);
                    // history.shift();

                    var param_value = parseInt(response.selectedIndex, 10) - 1;

                    var command_delay = 0;
                    for (var idx in cur_drone_list_selected) {
                        if (cur_drone_list_selected.hasOwnProperty(idx)) {
                            var drone_selected = cur_drone_list_selected[idx].name;

                            command_delay++;

                            follow_mode[target_system_id[drone_selected]].foll_enable = param_value;
                        }
                    }

                    setTimeout(eachFollowMenu, back_menu_delay * 2);
                }
            });
        }
        else {
            setTimeout(allMenu, back_menu_delay);
        }
    });
}

function actionRealControl() {
    if (key === 'BACKSPACE') {
        key = '';
        term.eraseDisplayAbove();
        setTimeout(allMenu, back_menu_delay);
    }
    else {
        column_count = 13;

        var command_delay = 0;
        for (var idx in cur_drone_list_selected) {
            if (cur_drone_list_selected.hasOwnProperty(idx)) {
                var drone_selected = cur_drone_list_selected[idx].name;

                command_delay++;

                if (rc1_trim.hasOwnProperty(target_system_id[drone_selected]) && rc2_trim.hasOwnProperty(target_system_id[drone_selected]) &&
                    rc3_trim.hasOwnProperty(target_system_id[drone_selected]) && rc4_trim.hasOwnProperty(target_system_id[drone_selected])) {
                    var chan3_raw = rc3_trim[target_system_id[drone_selected]].param_value + throttle_offset;
                    var chan4_raw = rc4_trim[target_system_id[drone_selected]].param_value + yaw_offset;
                    var chan2_raw = rc2_trim[target_system_id[drone_selected]].param_value + pitch_offset;
                    var chan1_raw = rc1_trim[target_system_id[drone_selected]].param_value + roll_offset;

                    term.moveTo.eraseLine.cyan(1, conf.drone.length + column_count, '[' + drone_selected + '] throttle: ' + chan3_raw + '(' + throttle_offset +
                        ') , yaw: ' + chan4_raw + '(' + yaw_offset +
                        ') , pitch: ' + chan2_raw + '(' + pitch_offset +
                        ') , roll: ' + chan1_raw + '(' + roll_offset + ')');
                    setTimeout(send_joystick_command, command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected]);
                }
                else {
                    chan3_raw = 0;
                    chan4_raw = 0;
                    chan2_raw = 0;
                    chan1_raw = 0;

                    term.moveTo.eraseLine.cyan(1, conf.drone.length + column_count, '[' + drone_selected + '] throttle: ' + chan3_raw + '(' + throttle_offset +
                        ') , yaw: ' + chan4_raw + '(' + yaw_offset +
                        ') , pitch: ' + chan2_raw + '(' + pitch_offset +
                        ') , roll: ' + chan1_raw + '(' + roll_offset + ')');
                    term.moveTo.eraseLine.red(1, conf.drone.length + conf.drone.length + column_count, "The rc parsms value is not set.\n");
                }

                column_count++;
            }
        }

        setTimeout(actionRealControl, 100 + command_delay);
    }
}

function eachRealControlMenu() {
    placeFlag = 'eachRealControlMenu';
    printFlag = 'enable';

    term.eraseDisplayBelow();

    //term.yellow("w: throttle up\ns: throttle down\na: yaw left\nd: yaw right\nup: pitch up\ndown: pitch down\nleft: roll left\nright: roll right\n");
    term.yellow("w: throttle_high\n" +
    "a: yaw_left\n" +
    "s: throttle_low\n" +
    "d: yaw_right\n" +
    "UP: pitch_forward\n" +
    "LEFT: roll_left\n" +
    "DOWN: pitch_backward\n" +
    "RIGHT: roll_right\n" +
    "7: loiter\n" +
    "9: alt_hold");

    setTimeout(actionRealControl, 1000);
}

setTimeout(startMenu, back_menu_delay);

function mavlinkGenerateMessage(src_sys_id, src_comp_id, type, params) {
    const mavlinkParser = new MAVLink(null/*logger*/, src_sys_id, src_comp_id);
    try {
        var mavMsg = null;
        var genMsg = null;
        //var targetSysId = sysId;
        var targetCompId = (params.targetCompId == undefined) ?
            0 :
            params.targetCompId;

        switch (type) {
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

            case mavlink.MAVLINK_MSG_ID_COMMAND_INT:
                mavMsg = new mavlink.messages.mission_item(params.target_system,
                    params.target_component,
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

            case mavlink.MAVLINK_MSG_ID_MISSION_ITEM_INT:
                mavMsg = new mavlink.messages.mission_item_int(params.target_system,
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

            case mavlink.MAVLINK_MSG_ID_MISSION_CLEAR_ALL:
                mavMsg = new mavlink.messages.mission_clear_all(params.target_system,
                    params.target_component,
                    params.mission_type);
                break;

            case mavlink.MAVLINK_MSG_ID_MISSION_COUNT:
                mavMsg = new mavlink.messages.mission_count(params.target_system,
                    params.target_component,
                    params.count,
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
            case mavlink.MAVLINK_MSG_ID_PARAM_REQUEST_READ:
                mavMsg = new mavlink.messages.param_request_read(params.target_system,
                    params.target_component,
                    params.param_id,
                    params.param_index);
                break;
        }
    }
    catch (e) {
        console.log('MAVLINK EX:' + e);
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
            term.red('msg: ' + msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

var column_count = 0;

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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Arm command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_start_mission_command(target_name, pub_topic, target_sys_id, param1, param2) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_MISSION_START;
    btn_params.confirmation = 0;
    btn_params.param1 = param1; // The first mission item to run.
    btn_params.param2 = param2; //The last mission item to run (after this item is run, the mission ends).
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Start Mission command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_takeoff_command2(target_name, pub_topic, target_sys_id, alt) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.seq = 0;
    btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    btn_params.command = mavlink.MAV_CMD_NAV_TAKEOFF;
    btn_params.current = 2;
    btn_params.autocontinue = 0;
    btn_params.param1 = 0; // Minimum pitch (if airspeed sensor present)
    btn_params.param2 = 0; // Empty
    btn_params.param3 = 0; // Empty
    btn_params.param4 = 0; // Yaw angle
    btn_params.param5 = 0; // Latitude
    btn_params.param6 = 0; // Longitude
    btn_params.param7 = alt; // Altitude
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Takeoff command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_takeoff_command(target_name, pub_topic, target_sys_id, alt) {
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Takeoff command to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + alt, target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Set Mode command to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + mode_items[custom_mode+1], target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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

function send_hold_command(target_name, pub_topic, target_sys_id) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.seq = 0;
    btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
    btn_params.current = 2;
    btn_params.autocontinue = 0;
    btn_params.param1 = 0;
    btn_params.param2 = 0;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = gpi[target_system_id[target_name]].lat / 10000000;
    btn_params.param6 = gpi[target_system_id[target_name]].lon / 10000000;
    btn_params.param7 = gpi[target_system_id[target_name]].relative_alt / 1000;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Hold command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_goto_alt_command(target_name, pub_topic, target_sys_id, alt) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.seq = 0;
    btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
    btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
    btn_params.current = 2;
    btn_params.autocontinue = 0;
    btn_params.param1 = 0;
    btn_params.param2 = 0;
    btn_params.param3 = 0;
    btn_params.param4 = 0;
    btn_params.param5 = gpi[target_system_id[target_name]].lat / 10000000;
    btn_params.param6 = gpi[target_system_id[target_name]].lon / 10000000;
    btn_params.param7 = alt;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Goto Alt command to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + alt, target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
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
    btn_params.autocontinue = 0;
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send GoTo command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

const MISSION_ACK_TIMEOUT_COUNT = 20;

function result_mission_item_complete(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count) {
    if(result_mission_ack[target_sys_id].type == 0) {
        term.moveTo.blue(1, conf.drone.length + column_count++, 'Mission Upload Complete to %s', target_name);

        var custom_mode = 3; // AUTO Mode
        var base_mode = hb[target_system_id[target_name]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
        setTimeout(send_set_mode_command, 100, target_name, target_pub_topic[target_name], target_system_id[target_name], base_mode, custom_mode);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Upload Error at %s', target_name);
        }
        else {
            term.moveTo.blue(152, conf.drone.length + result_column, result_check_count + ' - result_mission_item_complete ', target_name);
            setTimeout(result_mission_item_complete, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
        }
    }
}

function result_auto_mission_item_complete(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count) {
    if(result_mission_ack[target_sys_id].type == 0) {
        term.moveTo.blue(1, conf.drone.length + column_count++, 'Mission Upload Complete to %s', target_name);

        var custom_mode = 3; // AUTO Mode
        var base_mode = hb[target_system_id[target_name]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
        base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
        setTimeout(send_set_mode_command, 100, target_name, target_pub_topic[target_name], target_system_id[target_name], base_mode, custom_mode);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Upload Error at %s', target_name);
        }
        else {
            term.moveTo.blue(152, conf.drone.length + result_column, result_check_count + ' - result_mission_item_complete ', target_name);
            setTimeout(result_mission_item_complete, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
        }
    }
}

function result_mission_protocol(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count) {
    if(mission_request[target_sys_id].seq <= 1) {
        term.moveTo.blue(1, conf.drone.length + column_count++, mission_request[target_sys_id].seq + ' MISSION REQUEST from %s', target_name);

        setTimeout(send_mission_protocol, 1, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, mission_request[target_sys_id].seq);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Upload Error at %s', target_name);
        }
        else {
            term.moveTo.blue(152, conf.drone.length + result_column, result_check_count + ' - result_mission_protocol ', target_name);
            setTimeout(result_mission_protocol, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
        }
    }
}

function result_auto_mission_protocol(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count) {
    if(mission_request[target_sys_id].seq != 255) {
        term.moveTo.blue(1, conf.drone.length + column_count++, mission_request[target_sys_id].seq + ' MISSION REQUEST from %s', target_name);

        setTimeout(send_auto_mission_protocol, 1, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, mission_request[target_sys_id].seq);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Upload Error at %s', target_name);
        }
        else {
            term.moveTo.blue(152, conf.drone.length + result_column, result_check_count + ' - result_mission_protocol ', target_name);
            setTimeout(result_auto_mission_protocol, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
        }
    }
}

function send_mission_protocol(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, seq) {
    var btn_params = {};

    if(seq == 0) {
        btn_params.target_system = target_sys_id;
        btn_params.target_component = 1;
        btn_params.seq = 0;
        btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
        btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
        btn_params.current = 1;
        btn_params.autocontinue = 0;
        btn_params.param1 = 0;
        btn_params.param2 = 0;
        btn_params.param3 = 0;
        btn_params.param4 = 0;
        btn_params.param5 = gpi[target_system_id[target_name]].lat / 10000000;
        btn_params.param6 = gpi[target_system_id[target_name]].lon / 10000000;
        btn_params.param7 = gpi[target_system_id[target_name]].relative_alt / 1000;
        btn_params.mission_type = 0;
    }
    else {
        btn_params.target_system = target_sys_id;
        btn_params.target_component = 1;
        btn_params.seq = seq;
        btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
        btn_params.command = mavlink.MAV_CMD_NAV_LOITER_TURNS;
        btn_params.current = 0;
        btn_params.autocontinue = 1;
        btn_params.param1 = 1;
        btn_params.param2 = 0;
        btn_params.param3 = radius;
        btn_params.param4 = 0;
        btn_params.param5 = latitude;
        btn_params.param6 = longitude;
        btn_params.param7 = rel_altitude;
        btn_params.mission_type = 0;
    }

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, seq + ' Send MISSION_ITEM to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + radius, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(seq < 1) {
                if (!mission_request.hasOwnProperty(target_sys_id)) {
                    mission_request[target_sys_id] = {};
                }
                mission_request[target_sys_id].seq = 255;

                result_check_count = 0;
                setTimeout(result_mission_protocol, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
            }
            else {
                if(!result_mission_ack.hasOwnProperty(target_sys_id)) {
                    result_mission_ack[target_sys_id] = {};
                }
                result_mission_ack[target_sys_id].type = 255;

                result_check_count = 0;
                setTimeout(result_mission_item_complete, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
            }
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_auto_mission_protocol(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, seq) {
    var btn_params = {};

    if(seq == 0) {
        btn_params.target_system = target_sys_id;
        btn_params.target_component = 1;
        btn_params.seq = 0;
        btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
        btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
        btn_params.current = 1;
        btn_params.autocontinue = 0;
        btn_params.param1 = 0;
        btn_params.param2 = 0;
        btn_params.param3 = 0;
        btn_params.param4 = 0;
        btn_params.param5 = gpi[target_system_id[target_name]].lat / 10000000;
        btn_params.param6 = gpi[target_system_id[target_name]].lon / 10000000;
        btn_params.param7 = gpi[target_system_id[target_name]].relative_alt / 1000;
        btn_params.mission_type = 0;
    }
    else {
        cur_goto_position = goto_each_position[cur_idx++];

        var arr_cur_goto_position = cur_goto_position.split(':');
        var latitude = parseFloat(arr_cur_goto_position[0]);
        var longitude = parseFloat(arr_cur_goto_position[1]);
        var rel_altitude = parseFloat(arr_cur_goto_position[2]);
        var speed = parseFloat(arr_cur_goto_position[3]);

        btn_params.target_system = target_sys_id;
        btn_params.target_component = 1;
        btn_params.seq = seq;
        btn_params.frame = mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT; // 0: MAV_FRAME_GLOBAL, 3: MAV_FRAME_GLOBAL_RELATIVE_ALT
        btn_params.command = mavlink.MAV_CMD_NAV_WAYPOINT;
        btn_params.current = 0;
        btn_params.autocontinue = 1;
        btn_params.param1 = delay;
        btn_params.param2 = 0;
        btn_params.param3 = 0;
        btn_params.param4 = 0;
        btn_params.param5 = latitude;
        btn_params.param6 = longitude;
        btn_params.param7 = rel_altitude;
        btn_params.mission_type = 0;
    }

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, seq + ' Send MISSION_ITEM to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + cur_idx, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(cur_idx <= end_idx) {
                if (!mission_request.hasOwnProperty(target_sys_id)) {
                    mission_request[target_sys_id] = {};
                }
                mission_request[target_sys_id].seq = 255;

                result_check_count = 0;
                setTimeout(result_auto_mission_protocol, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
            }
            else {
                if(!result_mission_ack.hasOwnProperty(target_sys_id)) {
                    result_mission_ack[target_sys_id] = {};
                }
                result_mission_ack[target_sys_id].type = 255;

                result_check_count = 0;
                setTimeout(result_auto_mission_item_complete, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
            }
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_mission_count(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.count = 2;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_COUNT, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send MISSION_COUNT to %s, msg: ' + msg.toString('hex') + ' - ' + radius, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(!mission_request.hasOwnProperty(target_sys_id)) {
                mission_request[target_sys_id] = {};
            }
            mission_request[target_sys_id].seq = 255;

            result_check_count = 0;
            setTimeout(result_mission_protocol, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_auto_mission_count(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.count = 1 + end_idx - start_idx + 1;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_COUNT, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send MISSION_COUNT to %s, msg: ' + msg.toString('hex') + ' - ' + cur_idx, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(!mission_request.hasOwnProperty(target_sys_id)) {
                mission_request[target_sys_id] = {};
            }
            mission_request[target_sys_id].seq = 255;

            result_check_count = 0;
            setTimeout(result_auto_mission_protocol, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

var result_check_count = 0;
function result_mission_clear_all(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count) {
    if(result_mission_ack[target_sys_id].type == 0) {
        term.moveTo.blue(1, conf.drone.length + column_count++, 'Clear All Mission of %s', target_name);
        setTimeout(send_mission_count, 1, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Clear Error at %s', target_name);
        }
        else {
            term.moveTo.blue(136, conf.drone.length + result_column, result_check_count + ' - result_mission_clear_all ', target_name);
            setTimeout(result_mission_clear_all, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
        }
    }
}

function result_auto_mission_clear_all(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count) {
    if(result_mission_ack[target_sys_id].type == 0) {
        term.moveTo.blue(1, conf.drone.length + column_count++, 'Clear All Mission of %s', target_name);
        setTimeout(send_auto_mission_count, 1, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx);
    }
    else {
        result_check_count++;
        if(result_check_count > MISSION_ACK_TIMEOUT_COUNT) {
            term.moveTo.eraseLineAfter.red(136, conf.drone.length + result_column, 'Mission Clear Error at %s', target_name);
        }
        else {
            term.moveTo.blue(136, conf.drone.length + result_column, result_check_count + ' - result_mission_clear_all ', target_name);
            setTimeout(result_auto_mission_clear_all, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
        }
    }
}

var result_column = 0;
function send_goto_circle_command(target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_CLEAR_ALL, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Mission Clear All command to %s, msg: ' + msg.toString('hex') + ' - ' + radius, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(!result_mission_ack.hasOwnProperty(target_sys_id)) {
                result_mission_ack[target_sys_id] = {};
            }
            result_mission_ack[target_sys_id].type = 255;

            result_check_count = 0;
            setTimeout(result_mission_clear_all, 50, target_name, pub_topic, target_sys_id, latitude, longitude, rel_altitude, speed, radius, result_column, result_check_count);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_auto_command(target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.mission_type = 0;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_CLEAR_ALL, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            result_column = column_count;
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Mission Clear All command to %s, msg: ' + msg.toString('hex') + ' - ' + cur_idx, target_name);
            mqtt_client.publish(pub_topic, msg);

            if(!result_mission_ack.hasOwnProperty(target_sys_id)) {
                result_mission_ack[target_sys_id] = {};
            }
            result_mission_ack[target_sys_id].type = 255;

            result_check_count = 0;
            setTimeout(result_auto_mission_clear_all, 50, target_name, pub_topic, target_sys_id, goto_each_position, start_idx, end_idx, delay, cur_idx, result_column, result_check_count);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
    btn_params.autocontinue = 0;
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
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_MISSION_ITEM_INT, btn_params);
        //var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            //console.log('msg: ', msg);
            term.blue('\nSend GoTo command to %s\n', target_name);
            term.red('msg: ' + msg.toString('hex') + '\n');
            // console.log('msg_seq : ', msg.slice(2,3));
            //mqtt_client.publish(my_cnt_name, msg.toString('hex'));
            //_this.send_aggr_to_Mobius(my_cnt_name, msg.toString('hex'), 1500);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Change_Speed command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
    btn_params.param5 = 0; // Target latitude. If zero, the Copter will land at the current latitude.
    btn_params.param6 = 0; // Longitude
    btn_params.param7 = 0; // Altitude

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Land command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_rtl_command(target_name, pub_topic, target_sys_id) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH;
    btn_params.confirmation = 0;
    btn_params.param1 = 0; //
    btn_params.param2 = 0; //
    btn_params.param3 = 0; //
    btn_params.param4 = 0; //
    btn_params.param5 = 0; //
    btn_params.param6 = 0; //
    btn_params.param7 = 0; //

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send RTL command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_set_roi_command(target_name, pub_topic, target_sys_id, target_lat, target_lon, target_alt) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_DO_SET_ROI;
    btn_params.confirmation = 0;
    btn_params.param1 = 0; //
    btn_params.param2 = 0; //
    btn_params.param3 = 0; //
    btn_params.param4 = 0; //
    btn_params.param5 = target_lat; // Latitude (x) of the fixed ROI
    btn_params.param6 = target_lon; // Longitude (y) of the fixed ROI
    btn_params.param7 = target_alt; // Altitude of the fixed ROI

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Set ROI command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_set_servo_command(target_name, pub_topic, target_sys_id, target_number, target_pwm) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_DO_SET_SERVO;
    btn_params.confirmation = 0;
    btn_params.param1 = target_number; // Servo number - target servo output pin/channel number.
    btn_params.param2 = target_pwm; // PWM value to output, in microseconds (typically 1000 to 2000).
    btn_params.param3 = 0; //
    btn_params.param4 = 0; //
    btn_params.param5 = 0; //
    btn_params.param6 = 0; //
    btn_params.param7 = 0; //

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Set Servo command to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + target_number + ':' + target_pwm, target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_set_relay_command(target_name, pub_topic, target_sys_id, target_number, target_val) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.command = mavlink.MAV_CMD_DO_SET_RELAY;
    btn_params.confirmation = 0;
    btn_params.param1 = target_number; // Relay number.
    btn_params.param2 = target_val; // Set relay state: 1: Set relay high/on (3.3V on Pixhawk, 5V on APM). 0: Set relay low/off (0v) any other value toggles the relay
    btn_params.param3 = 0; //
    btn_params.param4 = 0; //
    btn_params.param5 = 0; //
    btn_params.param6 = 0; //
    btn_params.param7 = 0; //

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_COMMAND_LONG, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send Set Relay command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.red('msg: ' + msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send WP_YAW_HEHAVIOR param set command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_atc_slew_yaw_param_set_command(target_name, pub_topic, target_sys_id, value) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "ATC_SLEW_YAW";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_REAL32;
    btn_params.param_value = value * 100; // centidegrees pre second (500 - 18000)

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send ATC_SLEW_YAW param set command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_acro_yaw_p_param_set_command(target_name, pub_topic, target_sys_id, value) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "ACRO_YAW_P";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_UINT8;
    btn_params.param_value = value; // Converts pilot yaw input into a desired rate of rotation. Higher values mean faster rate of rotation. (1 - 10)

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send ACRO_YAW_P param set command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_wpnav_radius_param_set_command(target_name, pub_topic, target_sys_id, value) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "WPNAV_RADIUS";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_UINT16;
    btn_params.param_value = value; // Defines the distance from a waypoint, that when crossed indicates the wp has been hit. (5 ~ 1000 cm)

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send WPNAV_RADIUS param set command to %s, ' + 'msg: ' + msg.toString('hex') + ' - ' + value, target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send WPNAV Speed command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send WPNAV Speed DN to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.red('msg: ' + msg.toString('hex') + '\n');
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_circle_radius_param_set_command(target_name, pub_topic, target_sys_id, target_radius) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "CIRCLE_RADIUS";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_UINT32;
    btn_params.param_value = target_radius * 100; // cm / s.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send set CIRCLE_RADIUS (' + target_radius + ') command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_circle_rate_param_set_command(target_name, pub_topic, target_sys_id, target_rate) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "CIRCLE_RATE";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_INT16;
    btn_params.param_value = target_rate; // v = rw -> w = v / r.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send set CIRCLE_RATE (' + target_rate + ') command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

function send_servo_param_set_command(target_name, pub_topic, target_sys_id, target_number, target_val) {
    var btn_params = {};
    btn_params.target_system = target_sys_id;
    btn_params.target_component = 1;
    btn_params.param_id = "SERVO" + target_number + "_FUNCTION";
    btn_params.param_type = mavlink.MAV_PARAM_TYPE_REAL32;
    btn_params.param_value = target_val; // v = rw -> w = v / r.

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_PARAM_SET, btn_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send set SERVO' + target_number + '_FUNCTION command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send SYSID_THISMAV command to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

// CIRCLE Mode
// CIRCLE_CONTROL<CIRCLE_CONTROL>
// v=rw (속도 = 반지름 * 각속도) CIRCLE_RADIUS, CIRCLE_RATE

// Follow Mode
// FOLL_ENABLE : set to 1 to enable follow mode and refresh parameters
// FOLL_SYSID : MAVLink system id of lead vehicle (“0” means follow the first vehicle “seen”)
// FOLL_DIST_MAX : if lead vehicle is more than this many meters away, give up on following and hold position
// FOLL_OFS_X, FOLL_OFS_Y, FOLL_OFS_Z : 3D offset (in meters) from the lead vehicle
// FOLL_OFS_TYPE : set to 0 if offsets are North-East-Down, 1 if offsets are relative to lead vehicle’s heading
// FOLL_YAW_BEHAVE : controls whether follow points in the same direction as lead vehicle or always towards it
// FOLL_POS_P : gain which controls how aggressively this vehicle moves towards lead vehicle (limited by WPNAV_SPEED)
// FOLL_ALT_TYPE : allows selecting whether to use lead vehicle’s relative-to-home or relative-to-sea-level altitude

// MAV_CMD_DO_SET_ROI
// Sets the region of interest (ROI) for a sensor set or the vehicle itself. This can then be used by the vehicles control system to control the vehicle attitude and the attitude of various sensors such as cameras.

// MAV_CMD_DO_SET_RELAY
// Set a Relay pin’s voltage high (on) or low (off).

// MAV_CMD_DO_SET_SERVO
// Set a given servo pin output to a specific PWM value.

var printFlag = '';
setInterval(function () {
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            var drone_selected = conf.drone[idx].name;

            if(!autoLandingGearFlag.hasOwnProperty(drone_selected)) {
                autoLandingGearFlag[drone_selected] = 'down';
            }

            if(!autoLedFlag.hasOwnProperty(drone_selected)) {
                autoLedFlag[drone_selected] = 'off';
            }

            if(!curPosInfo.hasOwnProperty(drone_selected)) {
                curPosInfo[drone_selected] = {};
                curPosInfo[drone_selected].lat = 0.0;
                curPosInfo[drone_selected].lon = 0.0;
                curPosInfo[drone_selected].alt = 0.0;
                curPosInfo[drone_selected].speed = 0.0;
                curPosInfo[drone_selected].status = 'Disarmed';
                curPosInfo[drone_selected].mode = 'Unknown';
                curPosInfo[drone_selected].voltage_battery = 0.0;
            }

            if (printFlag === 'enable') {
                term.moveTo.eraseLine.magenta(1, parseInt(idx, 10) + 2, "[%s]", drone_selected);
                term.moveTo.magenta(24, parseInt(idx, 10) + 2, "%s:%s [%s] [%s] [%s] [%s] [%sV] [%s] [%s] [%s]",
                    curPosInfo[drone_selected].lat.toFixed(7), curPosInfo[drone_selected].lon.toFixed(7), curPosInfo[drone_selected].alt.toFixed(1),
                    curPosInfo[drone_selected].speed.toFixed(1), curPosInfo[drone_selected].status, curPosInfo[drone_selected].mode, curPosInfo[drone_selected].voltage_battery,
                    goto_dist, autoLedFlag[drone_selected], autoLandingGearFlag[drone_selected]);
            }
        }
    }
}, 1000);

var goto_dist = 0;
var placeFlag = '';
var autoLandingGearFlag = {};
var autoLedFlag = {};
var curPosInfo = {};

setInterval(function () {
    var command_delay = 0;
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {

            if(drone_info_file_update_flag == 1) {
                drone_info_file_update_flag = 0;

                drone_items.push(conf.drone[idx].name);
                goto_position[conf.drone[idx].name] = [];
                goto_position[conf.drone[idx].name] = conf.drone[idx].goto_position;
                target_system_id[conf.drone[idx].name] = conf.drone[idx].system_id;
                goto_all_index[conf.drone[idx].name] = goto_all_seq++;

                goto_position_selected[idx] = '0:0:0';

                hb[conf.drone[idx].system_id] = {};
                hb[conf.drone[idx].system_id].base_mode = 0;
                hb[conf.drone[idx].system_id].custom_mode = 0;

                gpi[conf.drone[idx].system_id] = {};
                gpi[conf.drone[idx].system_id].time_boot_ms = 0;
                gpi[conf.drone[idx].system_id].lat = 0;
                gpi[conf.drone[idx].system_id].lon = 0;
                gpi[conf.drone[idx].system_id].alt = 0;
                gpi[conf.drone[idx].system_id].relative_alt = 0;
                gpi[conf.drone[idx].system_id].vx = 0;
                gpi[conf.drone[idx].system_id].vy = 0;

                follow_mode[conf.drone[idx].system_id] = {};
                follow_mode[conf.drone[idx].system_id].foll_enable = 0;
                follow_mode[conf.drone[idx].system_id].foll_sysid = 0;
                follow_mode[conf.drone[idx].system_id].foll_dist_max = 10;
                follow_mode[conf.drone[idx].system_id].foll_ofs_x = 0;
                follow_mode[conf.drone[idx].system_id].foll_ofs_y = 0;
                follow_mode[conf.drone[idx].system_id].foll_ofs_z = 10;
                follow_mode[conf.drone[idx].system_id].foll_pos_p = 5;

                target_pub_topic[conf.drone[idx].name] = '/Mobius/' + conf.drone[idx].gcs + '/GCS_Data/' + conf.drone[idx].name;
            }
            else {
                command_delay++;

                var drone_selected = conf.drone[idx].name;

                if (!autoLandingGearFlag.hasOwnProperty(drone_selected)) {
                    autoLandingGearFlag[drone_selected] = 'down';
                }

                if (!autoLedFlag.hasOwnProperty(drone_selected)) {
                    autoLedFlag[drone_selected] = 'off';
                }

                if (!curPosInfo.hasOwnProperty(drone_selected)) {
                    curPosInfo[drone_selected] = {};
                    curPosInfo[drone_selected].lat = 0.0;
                    curPosInfo[drone_selected].lon = 0.0;
                    curPosInfo[drone_selected].alt = 0.0;
                    curPosInfo[drone_selected].speed = 0.0;
                    curPosInfo[drone_selected].status = 'Disarmed';
                    curPosInfo[drone_selected].mode = 'Unknown';
                }

                if (!gpi.hasOwnProperty(target_system_id[drone_selected])) {
                    gpi[target_system_id[drone_selected]] = {};
                    gpi[target_system_id[drone_selected]].lat = 0.0;
                    gpi[target_system_id[drone_selected]].lon = 0.0;
                    gpi[target_system_id[drone_selected]].relative_alt = 0.0;
                    gpi[target_system_id[drone_selected]].vx = 0.0;
                    gpi[target_system_id[drone_selected]].vy = 0.0;
                }

                curPosInfo[drone_selected].lat = (gpi[target_system_id[drone_selected]].lat / 10000000);
                curPosInfo[drone_selected].lon = (gpi[target_system_id[drone_selected]].lon / 10000000);
                curPosInfo[drone_selected].alt = gpi[target_system_id[drone_selected]].relative_alt / 1000;
                curPosInfo[drone_selected].speed = Math.sqrt(Math.pow(gpi[target_system_id[drone_selected]].vx, 2) + Math.pow(gpi[target_system_id[drone_selected]].vy, 2)) / 100;

                var result1 = dfs_xy_conv('toXY', curPosInfo[drone_selected].lat, curPosInfo[drone_selected].lon);

                if (hb.hasOwnProperty(target_system_id[drone_selected])) {
                    if (hb[target_system_id[drone_selected]].base_mode & 0x80) {
                        curPosInfo[drone_selected].status = 'Armed'
                    }
                    else {
                        curPosInfo[drone_selected].status = 'Disarmed'
                    }
                    curPosInfo[drone_selected].mode = mode_items[hb[target_system_id[drone_selected]].custom_mode + 1];
                }
                else {
                    curPosInfo[drone_selected].status = 'Unknown';
                    curPosInfo[drone_selected].mode = 'Unknown';
                }

                if (ss.hasOwnProperty(target_system_id[drone_selected])) {
                    curPosInfo[drone_selected].voltage_battery = (ss[target_system_id[drone_selected]].voltage_battery / 1000).toFixed(1);
                }
                else {
                    curPosInfo[drone_selected].voltage_battery = (0).toFixed(1);
                }

                if (cur_goto_position_selected.hasOwnProperty(drone_selected)) {
                    var arr_cur_goto_position = cur_goto_position_selected[drone_selected].split(':');
                    var tar_lat = parseFloat(arr_cur_goto_position[0]);
                    var tar_lon = parseFloat(arr_cur_goto_position[1]);
                    var tar_alt = parseFloat(arr_cur_goto_position[2]);
                    var result2 = dfs_xy_conv('toXY', tar_lat, tar_lon);

                    goto_dist = Math.sqrt(Math.pow(result2.x - result1.x, 2) + Math.pow(result2.y - result1.y, 2) + Math.pow((tar_alt - curPosInfo[drone_selected].alt), 2)).toFixed(2);
                }
                else {
                    goto_dist = (0.00).toFixed(2);
                }

                if (conf.auto_landing_gear == 'enable') {
                    if (curPosInfo[drone_selected].alt > 10.0 && curPosInfo[drone_selected].mode != 'ALT_HOLD' &&
                        curPosInfo[drone_selected].mode != 'LOITER' && curPosInfo[drone_selected].mode != 'POS_HOLD') {
                        if (autoLandingGearFlag[drone_selected] != 'up') {
                            var number = 10;
                            var pwm = 1900;
                            setTimeout(send_set_servo_command, 10 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, pwm);
                            autoLandingGearFlag[drone_selected] = 'up';
                        }
                    }
                    else if (curPosInfo[drone_selected].alt < 10.0 && curPosInfo[drone_selected].mode == 'LAND' &&
                        curPosInfo[drone_selected].mode == 'RTL') {
                        if (autoLandingGearFlag[drone_selected] != 'down') {
                            number = 10;
                            pwm = 1100;
                            setTimeout(send_set_servo_command, 10 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, pwm);
                            autoLandingGearFlag[drone_selected] = 'down';
                        }
                    }
                }

                if (conf.auto_led == 'enable') {
                    if (curPosInfo[drone_selected].alt > 5.0) {
                        if (autoLedFlag[drone_selected] == 'off') {
                            number = 9;
                            pwm = 1900;
                            setTimeout(send_set_servo_command, 10 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, pwm);
                            autoLedFlag[drone_selected] = 'on';
                        }
                    }
                    else if (curPosInfo[drone_selected].alt < 5.0) { //if(status == 'Disarmed') {
                        if (autoLedFlag[drone_selected] == 'on') {
                            number = 9;
                            pwm = 1100;
                            setTimeout(send_set_servo_command, 10 * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], number, pwm);
                            autoLedFlag[drone_selected] = 'off';
                        }
                    }
                }
            }
        }
    }
}, 800);

function send_param_get_command(target_name, pub_topic, target_sys_id, param_id) {
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
            term.moveTo.blue(1, conf.drone.length + column_count++, 'Send param get command of ' + param_id + ' to %s, ' + 'msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

// rc3
const throttle_max = 2006;
const throttle_min = 982;
const throttle_neutral = 1494
var throttle_val = throttle_min;
var throttle_offset = 0;

// rc4
const yaw_max = 2006;
const yaw_min = 982;
const yaw_neutral = 1493;
var yaw_val = yaw_neutral;
var yaw_offset = 0;

// rc2
const pitch_max = 2006;
const pitch_min = 982;
const pitch_neutral = 1496;
var pitch_val = pitch_neutral;
var pitch_offset = 0;

// rc1
const roll_max = 2006;
const roll_min = 982;
const roll_neutral = 1492;
var roll_val = roll_neutral;
var roll_offset = 0;

function send_joystick_command(target_name, pub_topic, target_sys_id) {
    var rc_params = {};
    rc_params.target_system = target_sys_id;
    rc_params.target_component = 1;
    //rc_params.chan3_raw = (rc3_max[target_sys_id] + rc3_min[target_sys_id]) / 2 + throttle_offset;
    rc_params.chan3_raw = parseFloat(rc3_trim[target_sys_id].param_value) + throttle_offset;
    rc_params.chan4_raw = rc4_trim[target_sys_id].param_value + yaw_offset;
    rc_params.chan2_raw = rc2_trim[target_sys_id].param_value + pitch_offset;
    rc_params.chan1_raw = rc1_trim[target_sys_id].param_value + roll_offset;
    rc_params.chan5_raw = 65535;
    rc_params.chan6_raw = 65535;
    rc_params.chan7_raw = 65535;
    rc_params.chan8_raw = 65535;

    try {
        var msg = mavlinkGenerateMessage(255, 0xbe, mavlink.MAVLINK_MSG_ID_RC_CHANNELS_OVERRIDE, rc_params);
        if (msg == null) {
            console.log("mavlink message is null");
        }
        else {
            term.moveTo.blue(1, conf.drone.length + conf.drone.length + column_count, 'Send joystick command to %s, msg: ' + msg.toString('hex') + '\n', target_name);
            mqtt_client.publish(pub_topic, msg);
        }
    }
    catch (ex) {
        console.log('[ERROR] ' + ex);
    }
}

var moment = require('moment');

function save_current_position() {
    var cur_pos = {};
    for (var idx in cur_drone_list_selected) {
        if (cur_drone_list_selected.hasOwnProperty(idx)) {
            var drone_selected = cur_drone_list_selected[idx].name;

            cur_pos[drone_selected]
            var cur_lat = (gpi[target_system_id[drone_selected]].lat / 10000000);
            var cur_lon = (gpi[target_system_id[drone_selected]].lon / 10000000);
            var cur_alt = gpi[target_system_id[drone_selected]].relative_alt / 1000;
            var cur_speed = Math.sqrt(Math.pow(gpi[target_system_id[drone_selected]].vx, 2) + Math.pow(gpi[target_system_id[drone_selected]].vy, 2)) / 100;

            cur_pos[drone_selected] = cur_lat + ':' + cur_lon + ':' + cur_alt + ':' + cur_speed;
        }
    }

    var timestamp = moment().format('MM-DD-HH-mm-ss');

    fs.writeFileSync('cur_pos_' + timestamp + '.json', JSON.stringify(cur_pos, null, 4), 'utf8');
}

// follow
setInterval(function () {
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            var drone_selected = conf.drone[idx].name;
            var command_delay = 0;

            if(!follow_mode.hasOwnProperty([target_system_id[drone_selected]])) {
                follow_mode[target_system_id[drone_selected]] = {};
            }

            if(!follow_mode.hasOwnProperty([target_system_id[drone_selected]].hasOwnProperty('foll_enable'))) {
                follow_mode[target_system_id[drone_selected]].foll_enable = 0;
            }

            if(follow_mode[target_system_id[drone_selected]].foll_enable === 1) {
                var foll_sysid = follow_mode[target_system_id[drone_selected]].foll_sysid;

                if(target_system_id.hasOwnProperty(foll_sysid)) {
                    if (target_system_id[drone_selected] != foll_sysid) {
                        var cur_lat = gpi[target_system_id[drone_selected]].lat / 10000000;
                        var cur_lon = gpi[target_system_id[drone_selected]].lon / 10000000;
                        var cur_alt = gpi[target_system_id[drone_selected]].relative_alt / 1000;

                        var result1 = dfs_xy_conv('toXY', cur_lat, cur_lon);

                        var tar_lat = (gpi[foll_sysid].lat / 10000000);
                        var tar_lon = (gpi[foll_sysid].lon / 10000000);
                        var tar_alt = gpi[foll_sysid].relative_alt / 1000;

                        var result2 = dfs_xy_conv('toXY', tar_lat, tar_lon);

                        var dist = Math.sqrt(Math.pow(result2.x - result1.x, 2) + Math.pow(result2.y - result1.y, 2) + Math.pow((tar_alt - cur_alt), 2));

                        if ((dist > follow_mode[target_system_id[drone_selected]].foll_dist_max) || (dist <= 4.0)) {
                            var foll_x = result2.x - follow_mode[target_system_id[drone_selected]].foll_ofs_x;
                            var foll_y = result2.y - follow_mode[target_system_id[drone_selected]].foll_ofs_y;
                            var foll_z = tar_alt - follow_mode[target_system_id[drone_selected]].foll_ofs_z;

                            var result3 = dfs_xy_conv('toLL', foll_x, foll_y);

                            command_delay++;

                            // set GUIDED Mode
                            var custom_mode = 4;
                            var base_mode = hb[target_system_id[drone_selected]].base_mode & ~mavlink.MAV_MODE_FLAG_DECODE_POSITION_CUSTOM_MODE;
                            base_mode |= mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED;
                            send_set_mode_command(drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], base_mode, custom_mode);

                            var lat = parseFloat(result3.lat);
                            var lon = parseFloat(result3.lon);
                            var alt = parseFloat(foll_z);
                            var speed = parseFloat(follow_mode[target_system_id[drone_selected]].foll_pos_p);

                            setTimeout(send_goto_command, (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], lat, lon, alt);

                            setTimeout(send_change_speed_command, back_menu_delay + (back_menu_delay / 2) * command_delay, drone_selected, target_pub_topic[drone_selected], target_system_id[drone_selected], speed);
                        }
                    }
                }
            }
        }
    }
}, 1500);

//
// LCC DFS 좌표변환을 위한 기초 자료
//
var RE = 6371.00877; // 지구 반경(km)
var GRID = 0.001; // 격자 간격(km)
var SLAT1 = 30.0; // 투영 위도1(degree)
var SLAT2 = 60.0; // 투영 위도2(degree)
var OLON = 126.0; // 기준점 경도(degree)
var OLAT = 38.0; // 기준점 위도(degree)
var XO = 43; // 기준점 X좌표(GRID)
var YO = 136; // 기1준점 Y좌표(GRID)
//
// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
//

function dfs_xy_conv(code, v1, v2) {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    var rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    else {
        rs['x'] = v1;
        rs['y'] = v2;
        var xn = v1 - XO;
        var yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        var alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        }
        else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            }
            else theta = Math.atan2(xn, yn);
        }
        var alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
}
//
// var result = dfs_xy_conv('toXY', 38.0, 126.0);
// console.log(result);
//
// var result1 = dfs_xy_conv('toXY', 36.3170540, 127.2341747);
// console.log(result1);
//
// var result2 = dfs_xy_conv('toXY', 36.3170600, 127.2340448);
// console.log(result2);
//
// var distXY = Math.sqrt(Math.pow(result2.x - result1.x, 2) + Math.pow(result2.y - result1.y, 2));
// console.log(distXY);
//
// result = dfs_xy_conv('toLL', 108326, -367983);
// console.log(result);


//
// exports.connect = function(uart, rxPin) {
//     var sbus = {
//         channels : new Uint16Array(18),
//         frameLoss : false,
//         failSafe : false
//     };
//     uart.setup(100000, {rx:rxPin, parity:"e",stopbits:2});
//     uart.removeAllListeners();
//     var data = "";
//     uart.on('data', function(d) {
//         data += d;
//         var idx = data.indexOf("\x00\x0f");
//         while (idx >= 0) {
//             if (idx==23) {
//                 var l = E.toUint8Array(data.substr(0,23));
//                 var status = l[22];
//                 E.mapInPlace(l,sbus.channels,undefined,-11);
//                 sbus.channels.set([status&128?2047:0,status&64?2047:0],16);
//                 sbus.frameLoss = !!(status&32);
//                 sbus.failSafe = !!(status&16);
//                 sbus.emit('frame', sbus);
//             }
//             data = data.substr(idx+2);
//             idx = data.indexOf("\x00\x0f");
//         }
//     });
//     return sbus;
// };

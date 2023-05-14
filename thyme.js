/**
 * Copyright (c) 2018, OCEAN, KETI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Created by Il Yeup, Ahn in KETI on 2016-08-19.
 */

var fs = require('fs');

global.resp_mqtt_ri_arr = [];

global.resp_mqtt_path_arr = {};
global.socket_q = {};

global.sh_state = 'crtae';

global.mqtt_client = null;

global.conf = {};

conf.cse = {};
conf.cse.host = 'gcs.iotocean.org'; // 'muv.iotocean.org';
conf.cse.port = 7579;
conf.cse.mqttport = 1883;
conf.usesecure = 'disable';
conf.commLink = 'tcp'; //'udp'; //'tcp';
conf.gcs_sys_id = 255;

// AE core
conf.rtk = 'KETI_RTK'

conf.aei = "S" + conf.rtk;

conf.sitl = {};
conf.sitl.name = "KETI_Simul_1";
conf.sitl.gcs = "KETI_GCS";
conf.sitl.goto_position = [
    'cancel', '37.2597483:126.6766316:6:2', '37.2597611:126.6759114:6:2'
];
conf.sitl.system_id = 105;

conf.drone = [];

global.drone_info_file = 'drone_info.json';

try {
    conf.drone = JSON.parse(fs.readFileSync(drone_info_file, 'utf8'));
} catch (e) {
    var info;

    info = {};
    info.name = 'KETI_Air_01';
    info.gcs = 'KETI_GCS';
    info.goto_position = [
        'cancel', '37.2597483:126.6766316:6:2', '37.2597611:126.6759114:6:2'
    ];
    info.system_id = 1;
    conf.drone.push(info);

    fs.writeFileSync(drone_info_file, JSON.stringify(conf.drone, null, 4), 'utf8');
}
conf.drone.unshift(conf.sitl);

conf.auto_landing_gear = 'disable';  // 'enable'; // 'disable';
conf.auto_led = 'disable';  // 'enable'; // 'disable';

conf.running_type = 'local';        // 'local' or 'global' : When this is worked in Server, select 'global'

require('./http_app');


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

global.resp_mqtt_ri_arr = [];

global.resp_mqtt_path_arr = {};
global.socket_q = {};

//fs.writeFileSync('aei.json', JSON.stringify(conf, null, 4), 'utf-8');

//global.sh_state = 'rtvae';
global.sh_state = 'crtae';

global.mqtt_client = null;

global.conf = {};

conf.cse = {};
conf.cse.host = '203.253.128.161';
conf.cse.port = 7579;
conf.cse.mqttport = 1883;
conf.usesecure = 'disable';
conf.commLink = 'tcp'; //'udp'; //'tcp';

// AE core

conf.gcs = 'UTM_UVARC';

conf.drone = [];

var info = {};
info.name = 'RKAH_UMACAir_01';
info.gcs = conf.gcs;
info.gcs_sys_id = 255;
conf.drone.push(info);

info = {};
info.name = 'RKAH_UMACAir_02';
info.gcs = conf.gcs;
info.gcs_sys_id = 255;
conf.drone.push(info);

info = {};
info.gcs = conf.gcs;
info.name = 'RKAH_UMACAir_03';
info.gcs_sys_id = 255;              // input number of sysid of GCS
conf.drone.push(info);

conf.running_type = 'local';        // 'local' or 'global' : When this is worked in Server, select 'global'

require('./http_app');


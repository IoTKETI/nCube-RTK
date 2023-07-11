# nCube-RTK

## 1. Settings

- ### edit `thyme.js`
```
- line 44, change RTK name 
conf.rtk = "KETI_RTK"
```

- ### edit `thyme.js`
  - line 42, change RTK name 
    ```
    conf.rtk = "KETI_RTK"
    ```

    - line 44, fix sitl info for rtk only
    ```
    conf.sitl = {};
    conf.sitl.name = "KETI_Simul_1"
    conf.sitl.gcs = "KETI_GCS"
    conf.sitl.goto_position = [
        'cancel', '37.2597483:126.6766316:6:2', '37.2597611:126.6759114:6:2'
    ];
    conf.sitl.system_id = 105
    ```

### Autorun via `pm2` on boot
1. Register PM2_HOME system variable to an environment variable
- variable - PM2_HOME
- value - C:\etc\\.pm2

2. Install [pm2](https://pm2.keymetrics.io/) and [pm2-windows-service](https://github.com/jon-hall/pm2-windows-service) packages for autorun
```shell
> npm install pm2-windows-service pm2 -g
```
3. Install the Service
```shell
> pm2-service-install
```
4. Configuration
```shell
> Perform environment setup (recommended)? Yes

> Set PM2_HOME? Yes

> PM2_HOME value (this path should be accessible to the service user and
should not contain any "user-context" variables [e.g. %APPDATA%]): c:\etc\.pm2\

> Set PM2_SERVICE_SCRIPTS (the list of start-up scripts for pm2)? Yes

> Set the list of start scripts/files (semi-colon separated json config
files or js files) (I left this one blank)

> Set PM2_SERVICE_PM2_DIR (the location of the global pm2 to use with the service)? [recommended] Yes

> Specify the directory containing the pm2 version to be used by the
service C:\USERS\ADMINISTRATOR\APPDATA\ROAMING\NPM\node_modules\pm2\index.js

PM2 service installed and started.
```
5. Reopen the Command Prompt with ***Administrative Privileges***
6. Run the app and save
```shell
> pm2 start backend\bin\www --name LTE-RC
> pm2 save   
```

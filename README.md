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

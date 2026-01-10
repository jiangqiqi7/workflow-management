一、接口名称
  获取当前正在执行的清洗步骤对应摄像头 Client ID。

二、接口用途说明
  图像算法服务在运行时需要获取当前正在执行的清洗任务对应的摄像头标识，用于建立 WebSocket 视频流连接。本接口实时返回系统当前唯一处于进行中（doing 状态）的清洗任务，并从该任务的当前步骤中（doing状态）获取设备标识 device_id（对应步骤读卡器的本地ipv4地址），再通过 rfid_to_camera 映射表转换为摄像头 IP（读卡器对应同一水槽的摄像头ip地址），最终以 camera_ip 作为 client_id 返回。

**返回的是当前正在进行的洗消任务的清洗槽的摄像头局域网ip****地址**。

在无代码平台中对每个洗槽的读卡器ip和摄像头ip进行一对一绑定，记录表位于 数据模型管理——内镜洗消追溯系统——系统管理——读卡器与摄像头绑定关系表。需要手动对摄像头进行管理，目前仅返回固定树脂。
  当系统中不存在正在执行的任务时，接口将返回空的 client_id，以便调用方进行流程判断。本接口为无参数接口，可随时调用。

三、接口地址
  GET http://116.204.65.72:8881/gdmp/v1/api/nt/get_current_client_id

四、调用方式
  HTTP GET 调用，无需携带 Query 参数，也无需请求体内容。
  建议使用 Content-Type: application/json。

五、返回内容说明
  接口返回 JSON 格式，字段说明如下：
  code：整数型。业务状态码，200 表示成功，500 表示服务器内部错误。
  client_id：字符串。摄像头 IP（通过 device_id 映射得到），供算法侧作为唯一标识使用。
  device_id：字符串。当前步骤绑定的设备 ID（读卡器 IP）。
  camera_ip：字符串。摄像头 IP，与 client_id 一致。
  task_id：整型。当前正在执行的清洗任务 ID。
  step_id：整型。当前处于进行中状态的清洗步骤 ID。
  message：字符串。返回结果的提示信息。
  error：字符串。当 code 为 500 时，包含脚本错误信息。

六、返回示例
  示例一：正常存在正在执行的步骤时
  {
   "code": 200,
   "client_id": "192.168.1.13",
   "device_id": "172.16.77.65",
   "camera_ip": "192.168.1.13",
   "task_id": 1012,
   "step_id": 4007,
   "message": "成功获取正在执行步骤的摄像头 IP"
  }

  示例二：系统中没有正在进行的任务
  {
   "code": 200,
   "client_id": null,
   "device_id": null,
   "camera_ip": null,
   "task_id": null,
   "step_id": null,
   "message": "当前没有正在进行的清洗任务"
  }

  示例三：服务器错误
  {
   "code": 500,
   "client_id": null,
   "device_id": null,
   "camera_ip": null,
   "task_id": null,
   "step_id": null,
   "message": "服务器错误",
   "error": "NullPointerException: xxx"
  }

七、错误码说明
  200：调用成功。若 client_id 为 null，表示当前没有进行中的清洗任务。
  500：服务器脚本运行期间发生异常，由 error 字段返回具体错误内容。

八、注意事项

  1. 若当前没有处于进行中状态的 clean_task，接口将返回 client_id = null。

  2. clean_step 的 device_id 必须在步骤启动时正确写入读卡器 IP，否则无法映射到摄像头。

  3. camera_ip 由 rfid_to_camera 表维护，请确保该表数据完整且准确。

  4. 若映射表中未找到对应的记录，将返回读卡器 IP 作为 client_id。

  5. 接口支持高频调用，可在算法端实时轮询。


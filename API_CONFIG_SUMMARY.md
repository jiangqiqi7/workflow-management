# API配置文件改造总结

## 改造内容

已成功将所有硬编码的API基础地址提取到配置文件中，现在可以在打包后通过修改配置文件来更改API地址，无需重新编译代码。

## 新增文件

### 1. public/config.json
配置文件，存储所有API基础地址：
```json
{
  "apiConfig": {
    "backendBase": "http://116.204.65.72:8881",
    "reviewNoticeBase": "http://36.103.203.206:8000",
    "videoStreamUrl": "ws://117.50.241.174:8000/ai/video"
  }
}
```

### 2. src/utils/config.js
配置管理工具，提供加载和获取配置的函数：
- `loadConfig()` - 加载配置文件
- `getApiConfig()` - 获取API配置对象
- `getBackendBase()` - 获取后端基础地址
- `getVideoStreamUrl()` - 获取视频流WebSocket地址
- `getReviewNoticeBase()` - 获取ReviewNotice基础地址

### 3. CONFIG_GUIDE.md
配置文件使用指南，详细说明如何修改和使用配置文件

## 修改的文件

### 1. src/App.vue
- 在应用启动时加载配置文件

### 2. src/views/WorkflowList.vue
修改的API地址：
- `backendBase` → `getBackendBase()`
- `alarmApiUrl` → `getAlarmApiUrl()`
- `reviewNoticeAlarmUrl` → `getReviewNoticeAlarmUrl(taskId)`
- `fetchRoomName` 中的硬编码地址 → `getRoomIdApiUrl()`

### 3. src/views/WorkflowPage.vue
修改的API地址：
- `backendBase` → `getBackendBase()`
- `apiUrl` → `getApiUrl()`

### 4. src/components/ReviewNotice.vue
修改的API地址：
- `fetchTaskId` 中的 `backendBase`
- `fetchLatestAlarm` 中的 `backendBase`

### 5. src/components/WorkArea.vue
修改的WebSocket地址：
- `wsUrl` 默认值使用 `getVideoStreamUrl()`
- `fetchReviewNoticeAlarms` 中的 `reviewNoticeBase`

## 提取的API地址汇总

### backendBase: http://116.204.65.72:8881
用于以下接口：
1. 获取工作流列表: `/cms/v1/module/business_script/runScriptByCode?code=get_workspace_list`
2. 获取特定任务: `/cms/v1/module/business_script/runScriptByCode?code=get_specific_task`
3. 获取最新告警: `/cms/v1/module/business_script/runScriptByCode?code=get_latest_alarm`
4. 获取房间ID: `/cms/v1/module/business_script/runScriptByCode?code=get_room_id`
5. 获取当前客户端ID: `/cms/v1/module/busine

### videoStreamUrl: ws://117.50.241.174:8000/ai/video
用于以下功能：
1. AI实时视频流WebSocket连接: `/ai/video?client_id={sourceIp}`ss_script/runScriptByCode?code=get_current_client_id`

### reviewNoticeBase: http://36.103.203.206:8000
用于以下接口：
1. 获取任务告警列表: `/task/{taskId}/alarms`

## 使用方法

### 开发环境
1. 修改 `public/config.json`
2. 保存后刷新页面

### 生产环境（打包后）
1. 执行 `npm run build`
2. 修改 `dist/config.json`
3. 刷新浏览器即可生效

## 优势

✅ **无需重新编译** - 修改配置文件后直接刷新即可  
✅ **环境隔离** - 轻松切换开发/测试/生产环境  
✅ **部署灵活** - 同一个打包文件可部署到不同环境  
✅ **配置集中** - 所有API地址统一管理  
✅ **向后兼容** - 配置加载失败时自动使用默认值  

## 注意事项

1. 配置文件必须是有效的JSON格式
2. 修改后需要刷新浏览器
3. 开发环境部分接口会使用Vite代理
4. 配置加载失败会使用默认配置，不影响功能

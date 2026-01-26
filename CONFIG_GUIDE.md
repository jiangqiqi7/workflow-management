# 配置文件使用说明

## 概述

本项目支持通过配置文件动态修改API地址，**打包后无需重新编译代码即可更改API地址**。

## 配置文件位置

**开发环境：** `public/config.json`  
**生产环境（打包后）：** `dist/config.json`

## 配置文件格式

```json
{
  "apiConfig": {
    "backendBase": "http://116.204.65.72:8881",
    "reviewNoticeBase": "http://36.103.203.206:8000",
    "videoStreamUrl": "ws://117.50.241.174:8000/ai/video"
  }
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `backendBase` | 后端API基础地址 | http://116.204.65.72:8881 |
| `reviewNoticeBase` | ReviewNotice告警接口基础地址 | http://36.103.203.206:8000 |
| `videoStreamUrl` | 视频流WebSocket地址 | ws://117.50.241.174:8000/ai/video |

## 使用方法

### 开发环境

1. 修改 `public/config.json` 文件
2. 保存后刷新页面即可生效

### 生产环境（打包后）

1. 执行打包命令：
   ```bash
   npm run build
   ```

2. 打包完成后，找到 `dist/config.json` 文件

3. 根据实际部署环境修改API地址：
   ```json
   {
     "apiConfig": {
       "backendBase": "http://您的后端地址:端口",
       "reviewNoticeBase": "http://您的告警服务:端口",
       "videoStreamUrl": "ws://您的视频流地址:端口/ai/video"
     }
   }
   ```

4. 保存文件后，刷新浏览器即可生效（无需重新打包）

## 涉及的API接口

### backendBase 相关接口

以下接口都使用 `backendBase` 作为基础地址：

- `/cms/v1/module/business_script/runScriptByCode?code=get_workspace_list` - 获取工作流列表
- `/cms/v1/module/business_script/runScriptByCode?code=get_specific_task` - 获取特定任务详情
- `/cms/v1/module/business_script/runScriptByCode?code=get_latest_alarm` - 获取最新告警
- `/cms/v1/module/business_script/runScriptByCode?code=get_room_id` - 获取房间ID
- `/cms/v1/module/business_script/runScriptByCode?code=get_current_client_id` - 获取当前客户端ID

### reviewNoticeBase 相关接口

以下接口使用 `reviewNoticeBase` 作为基础地址：


### videoStreamUrl 相关接口

WebSocket视频流地址：

- `ws://address/ai/video?client_id={sourceIp}` - AI实时视频流
- `/task/{taskId}/alarms` - 获取任务告警列表

## 注意事项

1. **配置文件必须是有效的JSON格式**，否则将使用默认配置
2. 修改配置文件后，需要**刷新浏览器**才能生效
3. 如果配置文件加载失败，系统会自动使用默认配置
4. 开发环境下某些接口会使用Vite代理，生产环境会直接请求配置的地址

## 故障排查

### 配置不生效？

1. 检查浏览器控制台是否有"配置文件加载成功"的日志
2. 确认 `config.json` 文件格式正确（可使用JSON验证工具）
3. 清除浏览器缓存后重试
4. 检查网络请求是否指向了正确的API地址

### 配置文件加载失败？

查看浏览器控制台错误信息：
- 如果是404错误，确认 `dist/config.json` 文件存在
- 如果是JSON解析错误，检查配置文件格式
- 系统会自动回退到默认配置，不会影响功能使用
,
    "videoStreamUrl": "ws://test.example.com:8000/ai/video"
  }
}
```

保存后刷新浏览器即可连接到测试环境。

## 示例：更换为生产环境

```json
{
  "apiConfig": {
    "backendBase": "https://api.production.com",
    "reviewNoticeBase": "https://alarm.production.com",
    "videoStreamUrl": "wss://video.production.com/ai/video"
  }
}
```

支持HTTP/HTTPS和WS/WSg": {
    "backendBase": "https://api.production.com",
    "reviewNoticeBase": "https://alarm.production.com"
  }
}
```

支持HTTP和HTTPS协议。

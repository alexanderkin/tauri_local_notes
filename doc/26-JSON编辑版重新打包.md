# 第 26 步：JSON 编辑版重新打包

## 1. 这一步的目标

把当前升级后的版本重新打包成桌面安装包。

## 2. 当前版本包含哪些能力

相比第一次打包版本，现在应用已经增加了：

- JSON 格式保存笔记
- 每条笔记都有唯一 ID
- 搜索笔记
- 删除单条笔记
- 删除前确认
- 编辑单条笔记
- 取消编辑

## 3. 打包前检查

打包前先确认应用在开发模式下能正常运行：

```powershell
npm.cmd run tauri dev
```

重点测试：

- 新增笔记
- 搜索笔记
- 删除单条
- 编辑笔记
- 取消编辑

## 4. 打包命令

在项目目录执行：

```powershell
npm.cmd run tauri build
```

## 5. 打包结果

打包成功后，安装包通常在：

```text
tauri-notes\src-tauri\target\release\bundle
```

重点查看：

```text
tauri-notes\src-tauri\target\release\bundle\msi
tauri-notes\src-tauri\target\release\bundle\nsis
```

## 6. 这一步完成后你学到了什么

- 新功能做完后，要重新验证打包
- 开发模式能运行，不代表一定能打包
- 每一轮较大功能升级后，都适合做一次发布验证

## 7. 这一步的小复盘

你刚刚完成的是：
把 JSON + 搜索 + 删除 + 编辑版本重新打包成功。

它在整个项目里的作用是：
证明这轮功能升级不只是开发模式可用，也已经具备再次发布的能力。

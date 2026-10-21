---
date: 2026-10-21
title: iOS 应用上架
tags:
  - App
  - Flutter
  - iOS
  - 上架发布
---

# iOS 应用上架

本文记录 Flutter 项目通过 Xcode 上传构建版本，并在 App Store Connect 提交审核的流程。示例沿用截图中的 `4.2.0 (2)` 版本；具体版本号、界面文案和审核时间以项目实际情况及 App Store Connect 当前页面为准。

整体流程可以理解为：**准备应用资料 → 生成 iOS 归档 → 上传构建版本 → 在 App Store Connect 选择构建版本 → 提交审核 → 等待审核结果**。

Flutter 官方支持用 `flutter build ipa` 生成 `.xcarchive` 和 `.ipa`。本篇按截图采用 Xcode Organizer 上传归档的方式；也可以使用 Transporter 或命令行上传。[Flutter：Build and release an iOS app](https://docs.flutter.dev/deployment/ios) · [Apple：Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)

## 一、上架前准备

开始之前，确认以下事项已经准备好：

| 项目 | 说明 |
| --- | --- |
| Apple Developer Program | 开发者账号处于有效状态，并且当前账号有上传构建版本、管理 App 或提交审核所需的权限。 |
| App Store Connect 应用记录 | 已创建 iOS App 记录；记录里的 Bundle ID 必须与 Flutter iOS 工程签名使用的 Bundle ID 一致。 |
| 证书与签名 | Xcode 中已选择正确的 Team，发布构建能够使用有效的签名和 provisioning profile。 |
| 版本与构建号 | 本次提交的版本号符合发布计划，构建号是新的、未上传过的值。 |
| 商店资料 | 应用名称、描述、关键词、分类、年龄分级、隐私信息、价格和销售地区等资料已准备。 |
| 审核信息 | 如果 App 需要登录或依赖特定操作才能使用，准备可供审核人员使用的账号、密码和说明。 |
| 应用素材 | 准备符合当前 App Store Connect 要求的 App 图标、预览和截图。 |

审核人员需要登录、连接硬件或进入特殊页面时，应在 App Store Connect 的审核信息中写清操作步骤，并提供必要的测试资料。缺少审核所需信息会导致审核无法正常完成。[Apple：Provide information for a complete review](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review)

## 二、设置版本号和构建号

Flutter 项目的版本通常写在 `pubspec.yaml`：

```yaml
version: 4.2.0+2
```

`+` 前面的 `4.2.0` 是面向用户的版本号，`+` 后面的 `2` 是构建号。iOS 会分别映射为 `CFBundleShortVersionString` 和 `CFBundleVersion`。同一版本可以有多个构建版本，但每次上传都要使用未重复的构建号。[Flutter：Update the app's build and version numbers](https://docs.flutter.dev/deployment/ios#update-the-apps-build-and-version-numbers)

也可以在构建时覆盖 `pubspec.yaml` 中的值：

```bash
flutter build ipa --build-name=4.2.0 --build-number=2
```

提交前检查版本号、构建号和 App Store Connect 中计划提交的版本是否一致，避免把旧构建版本选进新版本记录。

## 三、生成 iOS 发布归档

在 Flutter 项目根目录执行：

```bash
flutter build ipa
```

命令成功后，Flutter 会生成：

```text
build/ios/archive/   # Xcode 归档文件 .xcarchive
build/ios/ipa/       # 可分发的 .ipa 文件
```

截图使用的是 `.xcarchive`。如果项目通过其他方式生成了归档，也可以从 Xcode Organizer 打开对应的归档文件。

## 四、通过 Xcode 上传到 App Store Connect

### 1. 在 Organizer 中找到归档

打开 Xcode，选择 **Window → Organizer**，进入左侧的 **Archives**，选中本次构建的 `Runner` 归档。重点核对版本号、构建号和 Bundle ID，再点击 **Distribute App**。

![Xcode Organizer 中选中 Runner 归档并点击 Distribute App](/images/app/ios/xcode-organizer-archive.png)

如果 Organizer 没有自动显示归档，可以在 Finder 中找到 `.xcarchive` 后打开，或回到项目检查归档是否生成成功。

### 2. 选择 App Store Connect 分发方式

在分发方式中选择 **App Store Connect**，然后点击 **Distribute**。这是上传到 App Store Connect、供 TestFlight 测试或后续提交审核的路径。

![Xcode 选择 App Store Connect 分发方式](/images/app/ios/xcode-distribution-method.png)

按向导检查签名和上传选项。使用推荐配置时，Xcode 会完成校验并上传归档。上传结束后查看 Xcode 的交付结果；若显示错误，先按错误内容修复，再重新构建和上传。

### 3. 处理 dSYM 符号文件警告

截图中的 Xcode 提示上传已完成，但未找到 `objective_c.framework` 对应 UUID 的 dSYM 文件：

![Xcode 上传完成但提示缺少 objective_c.framework 的 dSYM](/images/app/ios/xcode-dsym-warning.png)

`.dSYM` 用于把崩溃报告中的地址转换成可读的函数名和行号。二进制文件与 dSYM 必须匹配同一个 build UUID；缺少或 UUID 不匹配时，相关崩溃堆栈可能无法完整符号化。[Apple：Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) · [Apple：Locating a missing debug symbol file](https://developer.apple.com/documentation/xcode/locating-a-missing-debug-symbol-file)

本次截图中的归档随后出现在 App Store Connect 的构建列表并进入“正在处理”，说明该次上传继续进入了 Apple 的处理流程。出现类似警告时，不要只根据 Xcode 弹窗判断审核构建是否可用：先在 App Store Connect 核对对应构建的上传状态和警告详情；同时记录缺失的 framework 与 UUID，必要时从对应依赖或构建产物中补齐匹配的 dSYM。

## 五、在 App Store Connect 等待构建处理

上传完成后，在 App Store Connect 打开应用的 **TestFlight** 或构建版本区域，查看上传进度。截图中的 `4.2.0 (2)` 状态为“正在处理”：

![App Store Connect 中的构建版本处理状态](/images/app/ios/app-store-connect-processing.png)

Apple 需要先处理上传的构建版本，处理完成后它才会出现在可选构建列表中；处理完成时通常会收到邮件通知。如果长时间停留在 **Processing**，可查看构建详情和 App Store Connect 的状态说明，Apple 当前文档建议超过 24 小时仍在处理时联系支持。[Apple：Build upload statuses](https://developer.apple.com/help/app-store-connect/reference/app-uploads/build-upload-statuses/)

不要在构建仍处理中时反复上传相同构建号。处理结束后，确认版本号、构建号和上传时间都对应本次归档。

## 六、创建版本并填写商店资料

在应用的 App Store 页面创建或打开要发布的 iOS 版本。截图中 `4.2.0` 为“准备提交”，`4.1.0` 为“可分发”：

![App Store Connect 中 iOS 版本的提交状态](/images/app/ios/app-store-connect-version-status.png)

在版本详情页完成必填信息，并在 **Build** 区域选择刚处理完成的构建版本。填写或核对：

- 本次版本的更新说明；
- App 预览和截图；
- 描述、关键词、支持网址等产品页面信息；
- App 隐私、年龄分级、版权及出口合规相关信息；
- 审核联系信息、登录账号和审核说明；
- 价格、税务类别和销售地区（按项目需要）。

保存页面后再检查一次所选构建版本和所有必填项。App Store Connect 会提示未完成的资料或缺少的构建信息。

## 七、添加到审核并提交

截图展示的提交过程分为两个动作：

1. 点击 **添加以供审核（Add for Review）**，把当前版本加入一个审核提交；
2. 在右侧提交面板复核版本和构建信息，然后点击 **提交以供审核（Submit for Review）**。

只执行第一步时，提交可能仍处于草稿或 **Ready for Review** 状态，还没有正式进入审核。Apple 当前的说明也明确区分这两个步骤。[Apple：Submit an app](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app)

![App Store Connect 的提交审核面板](/images/app/ios/app-store-connect-submit-review.png)

正式提交后会显示确认信息。截图中显示“已提交 1 个项目”：

![App Store Connect 显示已提交 1 个项目](/images/app/ios/app-store-connect-submitted.png)

提交后到 App Store Connect 的 **App 审核（App Review）** 区域跟踪状态，并留意开发者账号邮箱。截图弹窗提示审核可能需要最多 48 小时；这只是该次界面的提示，审核时间会因提交内容和审核情况变化，不应把它当作固定时限。

## 八、审核通过后发布

审核通过后，按版本页面选择的发布方式上线。App Store Connect 支持自动发布、手动发布或分阶段发布；如果选择手动发布，审核通过后仍需回到版本页面执行发布操作。[Apple：Overview of publishing your app on the App Store](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/overview-of-publishing-your-app-on-the-app-store)

若审核被拒，先查看 App Review 的问题说明和消息，按要求修改应用或资料后重新提交。审核期间的沟通和补充资料在 **App Review** 区域处理。[Apple：Manage a submission with unresolved issues](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/manage-a-submission-with-unresolved-issues)

## 九、小结

| 阶段 | 操作 | 检查重点 |
| --- | --- | --- |
| 准备 | 准备开发者账号、应用记录和商店资料 | Bundle ID、签名和审核信息完整 |
| 构建 | 设置版本号与唯一构建号，执行 `flutter build ipa` | `.xcarchive` 和 `.ipa` 均成功生成 |
| 上传 | 在 Organizer 选择归档，通过 App Store Connect 分发 | 核对归档身份，处理上传错误和警告 |
| 处理 | 在 App Store Connect 等待构建处理完成 | 版本号、构建号和处理状态正确 |
| 提交 | 选择构建，完成版本资料，添加并提交审核 | “添加以供审核”后还要正式“提交以供审核” |
| 发布 | 跟踪审核状态，审核通过后按发布方式上线 | 手动发布时需再执行发布操作 |

几个容易忽略的点：

1. **版本号和构建号不是一回事**：版本号标识面向用户的版本，构建号区分每次上传的构建。
2. **上传完成不代表构建已可选**：Apple 还要处理构建，处理完成后才能在版本页面选择。
3. **警告和失败要分别看**：截图中的 dSYM 警告伴随上传成功，但要进一步核对 App Store Connect 状态和缺失符号的影响。
4. **dSYM 必须匹配 UUID**：找到同名但 UUID 不一致的符号文件也无法正确符号化对应崩溃。
5. **“添加以供审核”不是最终提交**：还要在提交面板点击“提交以供审核”，并确认状态进入审核流程。
6. **审核时间不是固定承诺**：以 App Store Connect 的实际状态和邮件通知为准。

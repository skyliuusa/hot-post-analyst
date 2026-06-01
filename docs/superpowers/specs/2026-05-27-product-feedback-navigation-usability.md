# Product Feedback: Navigation And Usability Gaps

Date: 2026-05-27

Source: User review in the in-app browser at `http://127.0.0.1:4173/`.

Status: Recorded for triage. Not yet implemented.

## Observed Problems

### 1. Home Page Purpose Is Unclear

The current home page does not make a clear product decision about its job.

Open question:

- Is the home page a marketing landing page?
- Is it an app dashboard?
- Is it just an entry screen for importing the first hot post?

Current risk:

- The page mixes landing-page promise, product-shell screenshot, top navigation, and app entry controls.
- This makes the first screen feel repetitive instead of giving the user one obvious next action.

### 2. Duplicate Navigation Controls

The top navigation bar and the left sidebar expose the same five destinations:

- 今日
- 导入
- 收藏
- 起稿
- 复盘

Current risk:

- Users see two competing navigation systems with the same functional meaning.
- The UI feels heavier than the product concept of “少文字、少按钮、功能藏进 sidebar/top bar”.

Design question:

- Should the top bar become workspace/status/actions only, while the sidebar owns app navigation?
- Or should the sidebar be removed outside the product screenshot / app shell?

### 3. Top-Right Private Workspace Actions Are Non-functional

The two buttons to the right of `私有工作区` are visible but do not perform any action:

- 搜索
- 设置

Current risk:

- They look like available controls, but clicking them gives no feedback.
- This makes the app feel unfinished.

Possible resolutions:

- Hide them until implemented.
- Disable them with a clear visual state.
- Implement minimal search/settings surfaces.

### 4. Saved Workspace Flow Is Not Useful Yet

The user reported that the 收藏 feature is not usable enough in the current version.

Likely contributing issues:

- Empty state does not strongly guide the user back to 导入.
- Saved content depends on successful import/correction, but the path is not obvious.
- The saved views may look like finished browsing features while real data is still sparse.

Follow-up needed:

- Reproduce the specific failure or confusing path.
- Decide whether 收藏 should show stronger onboarding, a direct import CTA, or a clearer first saved-item flow.

### 5. Xiaohongshu Link Input Shows A Link Error

When entering a 小红书 link, the product reports a link error.

Current technical context:

- The link parser is currently best-effort and local.
- It detects supported domains but does not actually crawl platform content.
- Unsupported or malformed URLs fall back to manual correction.

Current risk:

- The UI implies real automatic parsing, but the implementation cannot reliably parse 小红书 content yet.
- This mismatch creates user confusion.

Possible resolutions:

- Change copy from “自动解析” to “识别来源并进入校对”.
- Preserve the URL and always enter correction for recognized 小红书 domains.
- Show a more accurate message: “已识别小红书链接，平台内容需要你粘贴正文或上传截图补齐。”
- Later add real parser/OCR integration.

## Suggested Priority

1. Clarify the home page role and remove duplicate navigation.
2. Hide or disable non-functional top-right controls.
3. Make 小红书 link handling honest and recoverable.
4. Improve 收藏 empty/onboarding flow.
5. Revisit search/settings only after the import-to-saved loop feels reliable.

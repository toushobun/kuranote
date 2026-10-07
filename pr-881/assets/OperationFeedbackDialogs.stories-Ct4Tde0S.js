import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-COgO7ONn.js";import{n as i,t as a}from"./UserThemeProvider-42aVuImj.js";import{a as o,c as s,i as c,n as l,o as u,r as d,s as f}from"./OperationFeedbackDialogs-DxN349hZ.js";import{n as p,t as m}from"./BookmarkRounded-CjjSOvHN.js";var h,g,_,v,y,b,x,S,C,w;e((()=>{h=t(),p(),r(),i(),s(),g={title:`Molecules/UI/OperationFeedbackDialogs`,decorators:[e=>(0,h.jsx)(a,{children:(0,h.jsx)(e,{})})]},_={name:`成功反馈`,render:()=>(0,h.jsx)(f,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},v={name:`失败反馈`,render:()=>(0,h.jsx)(o,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},y={name:`操作反馈（按结果切换成功 / 失败）`,render:()=>(0,h.jsx)(u,{feedback:{kind:`failure`,message:`请稍后再试，或检查网络连接。`,title:`保存失败`},onClose:()=>void 0})},b={name:`弹窗保持打开时显示失败反馈`,render:()=>(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(d,{open:!0,onCancel:()=>void 0,onConfirm:()=>void 0,title:`编辑账户`}),(0,h.jsx)(o,{open:!0,onClose:()=>void 0,title:`账户操作失败`,description:`请修改账户名称后重试。`})]})},x={name:`删除确认`,render:()=>(0,h.jsx)(c,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},S={name:`自定义确认内容`,render:()=>(0,h.jsx)(d,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,h.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},C={name:`主按钮 + 文字按钮提示`,render:()=>(0,h.jsx)(l,{description:`目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。`,icon:(0,h.jsx)(m,{}),onClose:()=>void 0,onPrimary:()=>void 0,onSecondary:()=>void 0,open:!0,primaryLabel:`继续创建`,secondaryLabel:`稍后再说`,title:`稍后再继续？`})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "操作反馈（按结果切换成功 / 失败）",
  render: () => <OperationFeedback feedback={{
    kind: "failure",
    message: "请稍后再试，或检查网络连接。",
    title: "保存失败"
  }} onClose={() => undefined} />
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "弹窗保持打开时显示失败反馈",
  render: () => <>
      <ConfirmationDialog open onCancel={() => undefined} onConfirm={() => undefined} title="编辑账户" />
      <FailureFeedbackDialog open onClose={() => undefined} title="账户操作失败" description="请修改账户名称后重试。" />
    </>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  render: () => <DeleteConfirmationDialog description="删除后无法恢复。" onCancel={() => undefined} onConfirm={() => undefined} open title="确认删除这条记录？" />
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "自定义确认内容",
  render: () => <ConfirmationDialog cancelLabel="稍后再说" confirmLabel="继续" description="确认后会进入下一步。" illustration={<Box aria-hidden="true" sx={{
    bgcolor: "var(--user-theme-badge-bg)",
    borderRadius: "50%",
    height: 72,
    width: 72
  }} />} onCancel={() => undefined} onConfirm={() => undefined} open title="继续这个操作？" />
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "主按钮 + 文字按钮提示",
  render: () => <ActionPromptDialog description="目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。" icon={<BookmarkRoundedIcon />} onClose={() => undefined} onPrimary={() => undefined} onSecondary={() => undefined} open primaryLabel="继续创建" secondaryLabel="稍后再说" title="稍后再继续？" />
}`,...C.parameters?.docs?.source}}},w=[`Success`,`Failure`,`OperationFailure`,`FailureAboveModal`,`DeleteConfirmation`,`CustomConfirmation`,`ActionPrompt`]}))();export{C as ActionPrompt,S as CustomConfirmation,x as DeleteConfirmation,v as Failure,b as FailureAboveModal,y as OperationFailure,_ as Success,w as __namedExportsOrder,g as default};
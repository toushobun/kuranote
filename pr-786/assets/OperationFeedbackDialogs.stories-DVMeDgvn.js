import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-DrLImZSw.js";import{n as i,t as a}from"./UserThemeProvider-B-ESgFa0.js";import{a as o,i as s,n as c,o as l,r as u}from"./OperationFeedbackDialogs-BosoJO1V.js";var d,f,p,m,h,g,_,v;e((()=>{d=t(),r(),i(),l(),f={title:`Molecules/UI/OperationFeedbackDialogs`,decorators:[e=>(0,d.jsx)(a,{storageScope:`storybook-operation-feedback-dialog`,children:(0,d.jsx)(e,{})})]},p={name:`成功反馈`,render:()=>(0,d.jsx)(o,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},m={name:`失败反馈`,render:()=>(0,d.jsx)(s,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},h={name:`弹窗保持打开时显示失败反馈`,render:()=>(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(c,{open:!0,onCancel:()=>void 0,onConfirm:()=>void 0,title:`编辑账户`}),(0,d.jsx)(s,{open:!0,onClose:()=>void 0,title:`账户操作失败`,description:`请修改账户名称后重试。`})]})},g={name:`删除确认`,render:()=>(0,d.jsx)(u,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},_={name:`自定义确认内容`,render:()=>(0,d.jsx)(c,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,d.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "弹窗保持打开时显示失败反馈",
  render: () => <>
      <ConfirmationDialog open onCancel={() => undefined} onConfirm={() => undefined} title="编辑账户" />
      <FailureFeedbackDialog open onClose={() => undefined} title="账户操作失败" description="请修改账户名称后重试。" />
    </>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  render: () => <DeleteConfirmationDialog description="删除后无法恢复。" onCancel={() => undefined} onConfirm={() => undefined} open title="确认删除这条记录？" />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "自定义确认内容",
  render: () => <ConfirmationDialog cancelLabel="稍后再说" confirmLabel="继续" description="确认后会进入下一步。" illustration={<Box aria-hidden="true" sx={{
    bgcolor: "var(--user-theme-badge-bg)",
    borderRadius: "50%",
    height: 72,
    width: 72
  }} />} onCancel={() => undefined} onConfirm={() => undefined} open title="继续这个操作？" />
}`,..._.parameters?.docs?.source}}},v=[`Success`,`Failure`,`FailureAboveModal`,`DeleteConfirmation`,`CustomConfirmation`]}))();export{_ as CustomConfirmation,g as DeleteConfirmation,m as Failure,h as FailureAboveModal,p as Success,v as __namedExportsOrder,f as default};
import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-D9qpvLK3.js";import{a as i,i as a,n as o,o as s,r as c}from"./OperationFeedbackDialogs-DCE263Uc.js";import{n as l,t as u}from"./UserThemeProvider-DUJFhA7t.js";var d,f,p,m,h,g,_;e((()=>{d=t(),r(),l(),s(),f={title:`Molecules/UI/OperationFeedbackDialogs`,decorators:[e=>(0,d.jsx)(u,{storageScope:`storybook-operation-feedback-dialog`,children:(0,d.jsx)(e,{})})]},p={name:`成功反馈`,render:()=>(0,d.jsx)(i,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},m={name:`失败反馈`,render:()=>(0,d.jsx)(a,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},h={name:`删除确认`,render:()=>(0,d.jsx)(c,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},g={name:`自定义确认内容`,render:()=>(0,d.jsx)(o,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,d.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  render: () => <DeleteConfirmationDialog description="删除后无法恢复。" onCancel={() => undefined} onConfirm={() => undefined} open title="确认删除这条记录？" />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "自定义确认内容",
  render: () => <ConfirmationDialog cancelLabel="稍后再说" confirmLabel="继续" description="确认后会进入下一步。" illustration={<Box aria-hidden="true" sx={{
    bgcolor: "var(--user-theme-badge-bg)",
    borderRadius: "50%",
    height: 72,
    width: 72
  }} />} onCancel={() => undefined} onConfirm={() => undefined} open title="继续这个操作？" />
}`,...g.parameters?.docs?.source}}},_=[`Success`,`Failure`,`DeleteConfirmation`,`CustomConfirmation`]}))();export{g as CustomConfirmation,h as DeleteConfirmation,m as Failure,p as Success,_ as __namedExportsOrder,f as default};
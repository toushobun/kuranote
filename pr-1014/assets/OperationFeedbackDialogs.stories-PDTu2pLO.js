import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-DH_BzgPz.js";import{a as i,i as a,n as o,o as s,r as c,s as l}from"./OperationFeedbackDialogs-Dnp4SluY.js";var u,d,f,p,m,h,g,_,v;e((()=>{u=t(),r(),l(),d={title:`Molecules/UI/OperationFeedbackDialogs`},f={name:`成功反馈`,render:()=>(0,u.jsx)(s,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},p={name:`失败反馈`,render:()=>(0,u.jsx)(a,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},m={name:`操作反馈（按结果切换成功 / 失败）`,render:()=>(0,u.jsx)(i,{feedback:{kind:`failure`,message:`请稍后再试，或检查网络连接。`,title:`保存失败`},onClose:()=>void 0})},h={name:`弹窗保持打开时显示失败反馈`,render:()=>(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(o,{open:!0,onCancel:()=>void 0,onConfirm:()=>void 0,title:`编辑账户`}),(0,u.jsx)(a,{open:!0,onClose:()=>void 0,title:`账户操作失败`,description:`请修改账户名称后重试。`})]})},g={name:`删除确认`,render:()=>(0,u.jsx)(c,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},_={name:`自定义确认内容`,render:()=>(0,u.jsx)(o,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,u.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "操作反馈（按结果切换成功 / 失败）",
  render: () => <OperationFeedback feedback={{
    kind: "failure",
    message: "请稍后再试，或检查网络连接。",
    title: "保存失败"
  }} onClose={() => undefined} />
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
}`,..._.parameters?.docs?.source}}},v=[`Success`,`Failure`,`OperationFailure`,`FailureAboveModal`,`DeleteConfirmation`,`CustomConfirmation`]}))();export{_ as CustomConfirmation,g as DeleteConfirmation,p as Failure,h as FailureAboveModal,m as OperationFailure,f as Success,v as __namedExportsOrder,d as default};
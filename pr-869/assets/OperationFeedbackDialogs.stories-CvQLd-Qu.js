import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-Btbe1Npy.js";import{n as i,t as a}from"./UserThemeProvider-CPySeIPd.js";import{a as o,i as s,n as c,o as l,r as u,s as d}from"./OperationFeedbackDialogs-G6Tym8rm.js";var f,p,m,h,g,_,v,y,b;e((()=>{f=t(),r(),i(),d(),p={title:`Molecules/UI/OperationFeedbackDialogs`,decorators:[e=>(0,f.jsx)(a,{children:(0,f.jsx)(e,{})})]},m={name:`成功反馈`,render:()=>(0,f.jsx)(l,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},h={name:`失败反馈`,render:()=>(0,f.jsx)(s,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},g={name:`操作反馈（按结果切换成功 / 失败）`,render:()=>(0,f.jsx)(o,{feedback:{kind:`failure`,message:`请稍后再试，或检查网络连接。`,title:`保存失败`},onClose:()=>void 0})},_={name:`弹窗保持打开时显示失败反馈`,render:()=>(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(c,{open:!0,onCancel:()=>void 0,onConfirm:()=>void 0,title:`编辑账户`}),(0,f.jsx)(s,{open:!0,onClose:()=>void 0,title:`账户操作失败`,description:`请修改账户名称后重试。`})]})},v={name:`删除确认`,render:()=>(0,f.jsx)(u,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},y={name:`自定义确认内容`,render:()=>(0,f.jsx)(c,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,f.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "操作反馈（按结果切换成功 / 失败）",
  render: () => <OperationFeedback feedback={{
    kind: "failure",
    message: "请稍后再试，或检查网络连接。",
    title: "保存失败"
  }} onClose={() => undefined} />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "弹窗保持打开时显示失败反馈",
  render: () => <>
      <ConfirmationDialog open onCancel={() => undefined} onConfirm={() => undefined} title="编辑账户" />
      <FailureFeedbackDialog open onClose={() => undefined} title="账户操作失败" description="请修改账户名称后重试。" />
    </>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  render: () => <DeleteConfirmationDialog description="删除后无法恢复。" onCancel={() => undefined} onConfirm={() => undefined} open title="确认删除这条记录？" />
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "自定义确认内容",
  render: () => <ConfirmationDialog cancelLabel="稍后再说" confirmLabel="继续" description="确认后会进入下一步。" illustration={<Box aria-hidden="true" sx={{
    bgcolor: "var(--user-theme-badge-bg)",
    borderRadius: "50%",
    height: 72,
    width: 72
  }} />} onCancel={() => undefined} onConfirm={() => undefined} open title="继续这个操作？" />
}`,...y.parameters?.docs?.source}}},b=[`Success`,`Failure`,`OperationFailure`,`FailureAboveModal`,`DeleteConfirmation`,`CustomConfirmation`]}))();export{y as CustomConfirmation,v as DeleteConfirmation,h as Failure,_ as FailureAboveModal,g as OperationFailure,m as Success,b as __namedExportsOrder,p as default};
import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-BcSGLCRS.js";import{n as i,t as a}from"./UserThemeProvider-pqKi5BSI.js";import{n as o,t as s}from"./Button-DJTTRrLP.js";import{a as c,c as l,i as u,n as d,o as f,r as p,s as m}from"./OperationFeedbackDialogs-B5TlaIvW.js";import{n as h,t as g}from"./BookmarkRounded-CIN5O7y-.js";var _,v,y,b,x,S,C,w,T,E,D,O;e((()=>{_=t(),h(),r(),s(),i(),l(),v={title:`Molecules/UI/OperationFeedbackDialogs`,decorators:[e=>(0,_.jsx)(a,{children:(0,_.jsx)(e,{})})]},y={name:`成功反馈`,render:()=>(0,_.jsx)(m,{description:`这条记录已经保存，可以继续记录生活。`,onClose:()=>void 0,open:!0,title:`保存成功`})},b={name:`失败反馈`,render:()=>(0,_.jsx)(c,{description:`请稍后再试，或检查网络连接。`,onClose:()=>void 0,open:!0,title:`保存失败`})},x={name:`操作反馈（按结果切换成功 / 失败）`,render:()=>(0,_.jsx)(f,{feedback:{kind:`failure`,message:`请稍后再试，或检查网络连接。`,title:`保存失败`},onClose:()=>void 0})},S={name:`弹窗保持打开时显示失败反馈`,render:()=>(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(p,{open:!0,onCancel:()=>void 0,onConfirm:()=>void 0,title:`编辑账户`}),(0,_.jsx)(c,{open:!0,onClose:()=>void 0,title:`账户操作失败`,description:`请修改账户名称后重试。`})]})},C={name:`删除确认`,render:()=>(0,_.jsx)(u,{description:`删除后无法恢复。`,onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`确认删除这条记录？`})},w={name:`自定义确认内容`,render:()=>(0,_.jsx)(p,{cancelLabel:`稍后再说`,confirmLabel:`继续`,description:`确认后会进入下一步。`,illustration:(0,_.jsx)(n,{"aria-hidden":`true`,sx:{bgcolor:`var(--user-theme-badge-bg)`,borderRadius:`50%`,height:72,width:72}}),onCancel:()=>void 0,onConfirm:()=>void 0,open:!0,title:`继续这个操作？`})},T={name:`主按钮 + 文字按钮提示`,args:{description:`目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。`,icon:(0,_.jsx)(g,{}),onClose:()=>void 0,onPrimary:()=>void 0,onSecondary:()=>void 0,open:!0,primaryLabel:`继续创建`,secondaryLabel:`稍后再说`,title:`稍后再继续？`},render:e=>(0,_.jsx)(d,{...e})},E={...T,name:`带附加操作的提示`,args:{...T.args,extraAction:(0,_.jsx)(n,{sx:{mt:1},children:(0,_.jsx)(o,{onClick:()=>void 0,children:`其他操作`})})}},D={name:`提示操作处理中`,render:()=>(0,_.jsx)(d,{disabled:!0,description:`正在处理，请稍候。`,onClose:()=>{},onPrimary:()=>{},onSecondary:()=>{},open:!0,primaryLabel:`继续创建`,secondaryLabel:`稍后再说`,title:`稍后再继续？`})},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "成功反馈",
  render: () => <SuccessFeedbackDialog description="这条记录已经保存，可以继续记录生活。" onClose={() => undefined} open title="保存成功" />
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "失败反馈",
  render: () => <FailureFeedbackDialog description="请稍后再试，或检查网络连接。" onClose={() => undefined} open title="保存失败" />
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "操作反馈（按结果切换成功 / 失败）",
  render: () => <OperationFeedback feedback={{
    kind: "failure",
    message: "请稍后再试，或检查网络连接。",
    title: "保存失败"
  }} onClose={() => undefined} />
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "弹窗保持打开时显示失败反馈",
  render: () => <>
      <ConfirmationDialog open onCancel={() => undefined} onConfirm={() => undefined} title="编辑账户" />
      <FailureFeedbackDialog open onClose={() => undefined} title="账户操作失败" description="请修改账户名称后重试。" />
    </>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  render: () => <DeleteConfirmationDialog description="删除后无法恢复。" onCancel={() => undefined} onConfirm={() => undefined} open title="确认删除这条记录？" />
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "自定义确认内容",
  render: () => <ConfirmationDialog cancelLabel="稍后再说" confirmLabel="继续" description="确认后会进入下一步。" illustration={<Box aria-hidden="true" sx={{
    bgcolor: "var(--user-theme-badge-bg)",
    borderRadius: "50%",
    height: 72,
    width: 72
  }} />} onCancel={() => undefined} onConfirm={() => undefined} open title="继续这个操作？" />
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "主按钮 + 文字按钮提示",
  args: {
    description: "目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。",
    icon: <BookmarkRoundedIcon />,
    onClose: () => undefined,
    onPrimary: () => undefined,
    onSecondary: () => undefined,
    open: true,
    primaryLabel: "继续创建",
    secondaryLabel: "稍后再说",
    title: "稍后再继续？"
  },
  render: args => <ActionPromptDialog {...args} />
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  ...ActionPrompt,
  name: "带附加操作的提示",
  args: {
    ...ActionPrompt.args,
    extraAction: <Box sx={{
      mt: 1
    }}>
          <Button onClick={() => undefined}>其他操作</Button>
        </Box>
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "提示操作处理中",
  render: () => <ActionPromptDialog disabled description="正在处理，请稍候。" onClose={() => {}} onPrimary={() => {}} onSecondary={() => {}} open primaryLabel="继续创建" secondaryLabel="稍后再说" title="稍后再继续？" />
}`,...D.parameters?.docs?.source}}},O=[`Success`,`Failure`,`OperationFailure`,`FailureAboveModal`,`DeleteConfirmation`,`CustomConfirmation`,`ActionPrompt`,`ActionPromptWithExtraAction`,`ActionPromptDisabled`]}))();export{T as ActionPrompt,D as ActionPromptDisabled,E as ActionPromptWithExtraAction,w as CustomConfirmation,C as DeleteConfirmation,b as Failure,S as FailureAboveModal,x as OperationFailure,y as Success,O as __namedExportsOrder,v as default};
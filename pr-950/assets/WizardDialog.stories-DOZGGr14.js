import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-CWKirwdW.js";import{n as i,t as a}from"./WizardActionBar-UemS476b.js";import{n as o,t as s}from"./WizardDialog-C_S2-LFl.js";import{n as c,t as l}from"./WizardStepLayout-CzgBrcmD.js";var u,d,f,p,m,h,g;e((()=>{u=t(),r(),i(),o(),c(),d={title:`Molecules/UI/WizardDialog`,component:s,args:{title:`预设选择`,closeLabel:`关闭`,onClose:()=>{},open:!0,children:(0,u.jsx)(l,{actions:(0,u.jsx)(a,{previous:{label:`取消`,onClick:()=>{}},next:{label:`下一步`}}),children:(0,u.jsx)(n,{children:`内容区滚动，底部操作栏固定。标题栏预留顶部安全区。`})})}},f={},p={args:{headerContent:(0,u.jsx)(n,{sx:{textAlign:`center`},children:`1 / 3`})}},m={args:{disabled:!0,children:(0,u.jsx)(l,{actions:(0,u.jsx)(a,{previous:{label:`取消`,disabled:!0,onClick:()=>{}},next:{label:`添加`,loading:!0,loadingLabel:`添加中…`}}),children:(0,u.jsx)(n,{children:`提交期间禁止关闭。`})})}},h={args:{title:void 0,ariaLabel:`操作完成`}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    headerContent: <Typography sx={{
      textAlign: "center"
    }}>1 / 3</Typography>
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: <WizardStepLayout actions={<WizardActionBar previous={{
      label: "取消",
      disabled: true,
      onClick: () => {}
    }} next={{
      label: "添加",
      loading: true,
      loadingLabel: "添加中…"
    }} />}>
        <Typography>提交期间禁止关闭。</Typography>
      </WizardStepLayout>
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    title: undefined,
    ariaLabel: "操作完成"
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`WithHeaderContent`,`Submitting`,`WithoutTitle`]}))();export{f as Default,m as Submitting,p as WithHeaderContent,h as WithoutTitle,g as __namedExportsOrder,d as default};
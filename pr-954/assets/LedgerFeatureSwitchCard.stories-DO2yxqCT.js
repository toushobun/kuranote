import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-CWKirwdW.js";import{n as i,t as a}from"./ReceiptLongRounded-Dd9695t3.js";import{n as o,t as s}from"./LedgerFeatureSwitchCard-B3GUN7jC.js";var c,l,u,d,f,p,m,h;e((()=>{c=t(),i(),r(),o(),l={title:`Organisms/Ledgers/LedgerFeatureSwitchCard`,component:s,args:{description:`功能的简短说明。`,enabled:!0,icon:(0,c.jsx)(a,{}),onChange:()=>void 0,sectionTitle:`账本功能`,switchLabel:`启用功能`}},u={name:`默认`},d={name:`附带补充内容`,args:{children:(0,c.jsx)(n,{color:`textSecondary`,variant:`body2`,children:`开关下方的补充说明。`})}},f={name:`普通成员只读`,args:{canEdit:!1}},p={name:`加载状态`,args:{state:`loading`}},m={name:`错误状态`,args:{onRetry:()=>void 0,state:`error`}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "默认"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "附带补充内容",
  args: {
    children: <Typography color="textSecondary" variant="body2">
        开关下方的补充说明。
      </Typography>
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读",
  args: {
    canEdit: false
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "加载状态",
  args: {
    state: "loading"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "错误状态",
  args: {
    onRetry: () => undefined,
    state: "error"
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`WithChildren`,`Readonly`,`Loading`,`Error`]}))();export{u as Default,m as Error,p as Loading,f as Readonly,d as WithChildren,h as __namedExportsOrder,l as default};
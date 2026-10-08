import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-CcLU1bnS.js";import{n as i,t as a}from"./WizardActionBar-BpCNLUVu.js";var o,s,c,l,u,d,f;e((()=>{o=t(),n(),i(),s={title:`Molecules/UI/WizardActionBar`,component:a,decorators:[e=>(0,o.jsx)(r,{children:(0,o.jsx)(`div`,{style:{maxWidth:420},children:(0,o.jsx)(e,{})})})],args:{next:{label:`下一步`,onClick:()=>{}}}},c={name:`只有下一步（第 1 步）`},l={name:`上一步 + 下一步`,args:{previous:{label:`上一步`,onClick:()=>{}}}},u={name:`带跳过此步`,args:{previous:{label:`上一步`,onClick:()=>{}},skip:{label:`跳过此步`,onClick:()=>{}}}},d={name:`处理中`,args:{next:{label:`下一步`,loading:!0,loadingLabel:`保存中`},previous:{disabled:!0,label:`上一步`,onClick:()=>{}}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "只有下一步（第 1 步）"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "上一步 + 下一步",
  args: {
    previous: {
      label: "上一步",
      onClick: () => {}
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "带跳过此步",
  args: {
    previous: {
      label: "上一步",
      onClick: () => {}
    },
    skip: {
      label: "跳过此步",
      onClick: () => {}
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "处理中",
  args: {
    next: {
      label: "下一步",
      loading: true,
      loadingLabel: "保存中"
    },
    previous: {
      disabled: true,
      label: "上一步",
      onClick: () => {}
    }
  }
}`,...d.parameters?.docs?.source}}},f=[`NextOnly`,`PreviousAndNext`,`WithSkip`,`Loading`]}))();export{d as Loading,c as NextOnly,l as PreviousAndNext,u as WithSkip,f as __namedExportsOrder,s as default};
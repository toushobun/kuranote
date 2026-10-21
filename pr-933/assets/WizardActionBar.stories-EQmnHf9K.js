import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./WizardActionBar-Be9oYhDa.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`Molecules/UI/WizardActionBar`,component:r,decorators:[e=>(0,i.jsx)(`div`,{style:{maxWidth:420},children:(0,i.jsx)(e,{})})],args:{next:{label:`下一步`,onClick:()=>{}}}},o={name:`只有下一步（第 1 步）`},s={name:`上一步 + 下一步`,args:{previous:{label:`上一步`,onClick:()=>{}}}},c={name:`带跳过此步`,args:{previous:{label:`上一步`,onClick:()=>{}},skip:{label:`跳过此步`,onClick:()=>{}}}},l={name:`处理中`,args:{next:{label:`下一步`,loading:!0,loadingLabel:`保存中`},previous:{disabled:!0,label:`上一步`,onClick:()=>{}}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "只有下一步（第 1 步）"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "上一步 + 下一步",
  args: {
    previous: {
      label: "上一步",
      onClick: () => {}
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source}}},u=[`NextOnly`,`PreviousAndNext`,`WithSkip`,`Loading`]}))();export{l as Loading,o as NextOnly,s as PreviousAndNext,c as WithSkip,u as __namedExportsOrder,a as default};
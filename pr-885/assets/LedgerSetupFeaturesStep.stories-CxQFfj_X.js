import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n}from"./LedgerSetupAccountAddSheet-COjTez_7.js";import{a as r,i,n as a,o,r as s,t as c}from"./ledgerSetupWizardStoryUtils-DV1m7D_e.js";function l(e){return n({draft:{...n().setup.draft,features:{specialStatusEnabled:e}},step:4})}var u,d,f,p,m;e((()=>{o(),a(),t(),u=l(!1),d={title:`Organisms/Ledgers/LedgerSetupFeaturesStep`,component:r,decorators:i,args:{actions:c(u),...s,progress:u},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`默认（未开启）`},p={name:`已开启`,args:{progress:l(!0)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "默认（未开启）"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "已开启",
  args: {
    progress: createFeaturesProgress(true)
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Enabled`]}))();export{f as Default,p as Enabled,m as __namedExportsOrder,d as default};
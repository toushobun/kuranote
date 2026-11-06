import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n,i as r,n as i,r as a,s as o}from"./ledgerSetupWizardStoryUtils-CStrkFwn.js";import{n as s,t as c}from"./LedgerSetupWizard-BiTfnLlq.js";function l(e){return o({draft:{...o().setup.draft,features:{multiAccountPaymentEnabled:e,specialStatusEnabled:e}},step:4})}var u,d,f,p,m;e((()=>{s(),a(),n(),u=l(!1),d={title:`Organisms/Ledgers/LedgerSetupFeaturesStep`,component:c,decorators:t,args:{actions:i(u),...r,progress:u},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`默认（未开启）`},p={name:`已开启`,args:{progress:l(!0)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "默认（未开启）"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "已开启",
  args: {
    progress: createFeaturesProgress(true)
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Enabled`]}))();export{f as Default,p as Enabled,m as __namedExportsOrder,d as default};
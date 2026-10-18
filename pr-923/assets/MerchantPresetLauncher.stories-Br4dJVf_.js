import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,t as n}from"./merchant-DI9Rfugo.js";import{i as r,r as i}from"./MerchantPresetDialog-Dq3IVNbt.js";import{n as a,t as o}from"./MerchantPresetLauncher-5v9aivKs.js";var s,c,l,u,d;e((()=>{n(),r(),a(),s={title:`Organisms/Merchants/MerchantPresetLauncher`,component:o,args:{action:async()=>({}),loadAction:async()=>({options:i()}),onClose:()=>{}}},c={},l={args:{loadAction:()=>new Promise(()=>{})}},u={args:{loadAction:async()=>({error:t.merchant_preset_load_failed,errorKey:`load-story`})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    loadAction: () => new Promise<MerchantPresetLoadState>(() => {})
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    loadAction: async () => ({
      error: merchantErrorMessages.merchant_preset_load_failed,
      errorKey: "load-story"
    })
  }
}`,...u.parameters?.docs?.source}}},d=[`Ready`,`Loading`,`LoadFailure`]}))();export{u as LoadFailure,l as Loading,c as Ready,d as __namedExportsOrder,s as default};
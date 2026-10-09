import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-BbWKHYc7.js";import{f as i,g as a,l as o,o as s,r as c}from"./userProfileFixtures-CyNsihKp.js";import{n as l,t as u}from"./ProfileNicknameDialog-Cv9Orj0E.js";var d,f,p,m,h,g;e((()=>{d=t(),n(),o(),l(),f={title:`Organisms/Settings/ProfileNicknameDialog`,component:u,decorators:[e=>(0,d.jsx)(r,{children:(0,d.jsx)(e,{})})],args:{action:a,currentDisplayName:`淞文`,currentLedgerId:s,ledgers:i,onClose:()=>{},open:!0}},p={name:`有账本（保存后询问是否同步）`},m={name:`无账本（直接保存）`,args:{currentLedgerId:null,ledgers:[]}},h={name:`保存失败`,args:{action:c}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "有账本（保存后询问是否同步）"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "无账本（直接保存）",
  args: {
    currentLedgerId: null,
    ledgers: []
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: failedDisplayNameAction
  }
}`,...h.parameters?.docs?.source}}},g=[`WithLedgers`,`WithoutLedgers`,`SaveFailed`]}))();export{h as SaveFailed,p as WithLedgers,m as WithoutLedgers,g as __namedExportsOrder,f as default};
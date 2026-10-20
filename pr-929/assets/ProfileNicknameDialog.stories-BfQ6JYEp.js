import{i as e}from"./preload-helper-D2yxXLVK.js";import{f as t,g as n,l as r,o as i,r as a}from"./userProfileFixtures-CyNsihKp.js";import{n as o,t as s}from"./ProfileNicknameDialog-2gajKdgd.js";var c,l,u,d,f;e((()=>{r(),o(),c={title:`Organisms/Settings/ProfileNicknameDialog`,component:s,args:{action:n,currentDisplayName:`淞文`,currentLedgerId:i,ledgers:t,onClose:()=>{},open:!0}},l={name:`有账本（保存后询问是否同步）`},u={name:`无账本（直接保存）`,args:{currentLedgerId:null,ledgers:[]}},d={name:`保存失败`,args:{action:a}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "有账本（保存后询问是否同步）"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "无账本（直接保存）",
  args: {
    currentLedgerId: null,
    ledgers: []
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: failedDisplayNameAction
  }
}`,...d.parameters?.docs?.source}}},f=[`WithLedgers`,`WithoutLedgers`,`SaveFailed`]}))();export{d as SaveFailed,l as WithLedgers,u as WithoutLedgers,f as __namedExportsOrder,c as default};
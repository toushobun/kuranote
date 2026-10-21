import{i as e}from"./preload-helper-D2yxXLVK.js";import{_ as t,h as n,l as r,n as i,p as a}from"./userProfileFixtures-CyNsihKp.js";import{n as o,t as s}from"./ProfilePasswordDialog-DzJjtIX-.js";var c,l,u,d,f;e((()=>{r(),o(),c={title:`Organisms/Settings/ProfilePasswordDialog`,component:s,args:{changePasswordAction:n,email:`user@example.com`,onClose:()=>{},open:!0,requestOtpAction:t}},l={name:`发送验证码后修改密码`},u={name:`验证码发送过于频繁`,args:{requestOtpAction:a}},d={name:`验证码错误导致保存失败`,args:{changePasswordAction:i}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "发送验证码后修改密码"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "验证码发送过于频繁",
  args: {
    requestOtpAction: rateLimitedPasswordChangeOtpAction
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "验证码错误导致保存失败",
  args: {
    changePasswordAction: failedChangePasswordAction
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`SendRateLimited`,`SaveFailed`]}))();export{l as Default,d as SaveFailed,u as SendRateLimited,f as __namedExportsOrder,c as default};
import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-BG0zFw-O.js";import{a as i,c as a,f as o,n as s,u as c}from"./userProfileFixtures-DcGP1Cvk.js";import{n as l,t as u}from"./ProfilePasswordDialog-DBQdY9FF.js";var d,f,p,m,h,g;e((()=>{d=t(),n(),i(),l(),f={title:`Organisms/Settings/ProfilePasswordDialog`,component:u,decorators:[e=>(0,d.jsx)(r,{storageScope:`storybook-profile-password-dialog`,children:(0,d.jsx)(e,{})})],args:{changePasswordAction:c,email:`user@example.com`,onClose:()=>{},open:!0,requestOtpAction:o}},p={name:`发送验证码后修改密码`},m={name:`验证码发送过于频繁`,args:{requestOtpAction:a}},h={name:`验证码错误导致保存失败`,args:{changePasswordAction:s}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "发送验证码后修改密码"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "验证码发送过于频繁",
  args: {
    requestOtpAction: rateLimitedPasswordChangeOtpAction
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "验证码错误导致保存失败",
  args: {
    changePasswordAction: failedChangePasswordAction
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`SendRateLimited`,`SaveFailed`]}))();export{p as Default,h as SaveFailed,m as SendRateLimited,g as __namedExportsOrder,f as default};
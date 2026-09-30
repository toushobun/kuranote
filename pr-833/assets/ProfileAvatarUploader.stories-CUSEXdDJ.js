import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,s as n,t as r}from"./userProfileFixtures-CL6m5rR4.js";import{n as i,t as a}from"./ProfileAvatarUploader-DSItx_WL.js";var o,s,c,l,u;e((()=>{t(),i(),o={title:`Organisms/Settings/ProfileAvatarUploader`,component:a,args:{action:n,avatarUrl:null,displayName:`淞文`}},s={name:`无头像（点击选择图片后上传成功）`},c={name:`有头像`,args:{avatarUrl:`https://avatars.githubusercontent.com/u/92347214?v=4`}},l={name:`上传失败`,args:{action:r}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "无头像（点击选择图片后上传成功）"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "有头像",
  args: {
    avatarUrl: "https://avatars.githubusercontent.com/u/92347214?v=4"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "上传失败",
  args: {
    action: failedAvatarAction
  }
}`,...l.parameters?.docs?.source}}},u=[`WithoutAvatar`,`WithAvatar`,`UploadFailed`]}))();export{l as UploadFailed,c as WithAvatar,s as WithoutAvatar,u as __namedExportsOrder,o as default};
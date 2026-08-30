import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-BjDyLBkO.js";import{n as i,t as a}from"./LedgerInviteQrCode-DnW6GjGR.js";var o,s,c,l,u,d,f;e((()=>{o=t(),r(),i(),s=`https://kuranote.example/invite/0123456789abcdef0123456789abcdef`,c={component:a,title:`Molecules/Ledgers/LedgerInviteQrCode`},l={name:`默认二维码`,args:{ledgerName:`家庭账本`,link:s}},u={name:`链接已失效`,args:{emptyMessage:`该邀请链接已失效，无法显示二维码`,ledgerName:`家庭账本`,link:``}},d={name:`移动端宽度`,args:{ledgerName:`家庭账本`,link:s},decorators:[e=>(0,o.jsx)(n,{sx:{maxWidth:320,px:2,width:`100%`},children:(0,o.jsx)(e,{})})]},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "默认二维码",
  args: {
    ledgerName: "家庭账本",
    link: inviteLink
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "链接已失效",
  args: {
    emptyMessage: "该邀请链接已失效，无法显示二维码",
    ledgerName: "家庭账本",
    link: ""
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "移动端宽度",
  args: {
    ledgerName: "家庭账本",
    link: inviteLink
  },
  decorators: [StoryComponent => <Box sx={{
    maxWidth: 320,
    px: 2,
    width: "100%"
  }}>
        <StoryComponent />
      </Box>]
}`,...d.parameters?.docs?.source}}},f=[`Default`,`LinkUnavailable`,`MobileWidth`]}))();export{l as Default,u as LinkUnavailable,d as MobileWidth,f as __namedExportsOrder,c as default};
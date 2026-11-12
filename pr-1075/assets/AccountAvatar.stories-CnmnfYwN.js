import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-CedAN9w3.js";import{i,t as a}from"./accounts-xUbHAqfQ.js";import{n as o,t as s}from"./AccountAvatar-7Veb0ITe.js";var c,l,u,d,f,p;e((()=>{c=t(),i(),r(),o(),l={title:`Atoms/Accounts/AccountAvatar`,component:s,args:{id:`account-1`,name:`三井住友银行`,size:48}},u={name:`中文账户名`},d={name:`各种账户名与尺寸`,render:()=>(0,c.jsx)(n,{spacing:2,children:[48,28].map(e=>(0,c.jsx)(n,{direction:`row`,spacing:1.5,children:[`三井住友银行`,`日元现金`,`PayPay`,`Rakuten Card`,`ゆうちょ`].map((t,n)=>(0,c.jsx)(s,{id:`account-${n}`,name:t,size:e},t))},e))})},f={name:`网站图标`,args:{iconUrl:a.icon_url}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "中文账户名"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "各种账户名与尺寸",
  render: () => <Stack spacing={2}>
      {[48, 28].map(size => <Stack key={size} direction="row" spacing={1.5}>
          {["三井住友银行", "日元现金", "PayPay", "Rakuten Card", "ゆうちょ"].map((name, index) => <AccountAvatar key={name} id={\`account-\${index}\`} name={name} size={size} />)}
        </Stack>)}
    </Stack>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "网站图标",
  args: {
    iconUrl: accountWebsiteIconFixture.icon_url
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`Variants`,`WebsiteIcon`]}))();export{u as Default,d as Variants,f as WebsiteIcon,p as __namedExportsOrder,l as default};
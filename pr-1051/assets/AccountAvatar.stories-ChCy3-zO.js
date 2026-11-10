import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-CedAN9w3.js";import{n as i,t as a}from"./AccountAvatar-RNXPzWCf.js";var o,s,c,l,u;e((()=>{o=t(),r(),i(),s={title:`Atoms/Accounts/AccountAvatar`,component:a,args:{id:`account-1`,name:`三井住友银行`,size:48}},c={name:`中文账户名`},l={name:`各种账户名与尺寸`,render:()=>(0,o.jsx)(n,{spacing:2,children:[48,28].map(e=>(0,o.jsx)(n,{direction:`row`,spacing:1.5,children:[`三井住友银行`,`日元现金`,`PayPay`,`Rakuten Card`,`ゆうちょ`].map((t,n)=>(0,o.jsx)(a,{id:`account-${n}`,name:t,size:e},t))},e))})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "中文账户名"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "各种账户名与尺寸",
  render: () => <Stack spacing={2}>
      {[48, 28].map(size => <Stack key={size} direction="row" spacing={1.5}>
          {["三井住友银行", "日元现金", "PayPay", "Rakuten Card", "ゆうちょ"].map((name, index) => <AccountAvatar key={name} id={\`account-\${index}\`} name={name} size={size} />)}
        </Stack>)}
    </Stack>
}`,...l.parameters?.docs?.source}}},u=[`Default`,`Variants`]}))();export{c as Default,l as Variants,u as __namedExportsOrder,s as default};
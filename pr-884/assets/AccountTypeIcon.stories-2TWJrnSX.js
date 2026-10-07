import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-Blj2xom2.js";import{a as i}from"./account--_gaLiDT.js";import{t as a}from"./accounts-D1-BAErc.js";import{n as o,t as s}from"./AccountTypeIcon-DFZNEd0N.js";var c,l,u,d,f;e((()=>{c=t(),r(),a(),o(),l={title:`Atoms/Accounts/AccountTypeIcon`,component:s,args:{type:`bank`}},u={name:`银行卡`},d={name:`全部类型`,render:()=>(0,c.jsx)(n,{direction:`row`,spacing:2,children:i.map(({label:e,value:t})=>(0,c.jsxs)(n,{spacing:.5,sx:{alignItems:`center`},children:[(0,c.jsx)(s,{type:t}),(0,c.jsx)(`span`,{children:e})]},t))})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "银行卡"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "全部类型",
  render: () => <Stack direction="row" spacing={2}>
      {accountTypeOptions.map(({
      label,
      value
    }) => <Stack key={value} spacing={0.5} sx={{
      alignItems: "center"
    }}>
          <AccountTypeIcon type={value} />
          <span>{label}</span>
        </Stack>)}
    </Stack>
}`,...d.parameters?.docs?.source}}},f=[`Default`,`AllTypes`]}))();export{d as AllTypes,u as Default,f as __namedExportsOrder,l as default};
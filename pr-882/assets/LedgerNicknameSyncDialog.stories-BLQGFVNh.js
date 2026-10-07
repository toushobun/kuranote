import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{f as i,l as a,o}from"./userProfileFixtures-CyNsihKp.js";import{n as s,t as c}from"./LedgerNicknameSyncDialog-UauboSlB.js";function l(e){let[t,n]=(0,d.useState)(e.selectedLedgerIds);return(0,u.jsx)(c,{...e,onSelectAll:()=>n(new Set(e.ledgers.map(e=>e.ledgerId))),onSelectNone:()=>n(new Set),onToggle:e=>n(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n}),selectedLedgerIds:t})}var u,d,f,p,m,h;t((()=>{u=r(),d=e(n()),a(),s(),f={title:`Organisms/Settings/LedgerNicknameSyncDialog`,component:c,args:{displayName:`新昵称`,ledgers:i,onClose:()=>{},onConfirm:()=>{},onOnlyPersonal:()=>{},onSelectAll:()=>{},onSelectNone:()=>{},onToggle:()=>{},open:!0,pending:!1,selectedLedgerIds:new Set([o])}},p={name:`默认只勾选当前账本`,render:e=>(0,u.jsx)(l,{...e})},m={name:`提交中`,args:{pending:!0}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "默认只勾选当前账本",
  render: args => <InteractiveSyncDialog {...args} />
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    pending: true
  }
}`,...m.parameters?.docs?.source}}},h=[`DefaultCurrentLedger`,`Pending`]}))();export{p as DefaultCurrentLedger,m as Pending,h as __namedExportsOrder,f as default};
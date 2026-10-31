import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{i,n as a,t as o}from"./accountHolders-CVhGxNZy.js";import{n as s,t as c}from"./AccountHolderAvatarPicker-BcegG68i.js";function l({holderOptions:e,initialSelection:t,placeholderOptions:n}){let[r,i]=(0,d.useState)(t);return(0,u.jsx)(c,{holderOptions:e,onChange:i,placeholderOptions:n,selection:r})}var u,d,f,p,m,h,g,_;t((()=>{u=r(),d=e(n()),i(),s(),f={title:`Molecules/Accounts/AccountHolderAvatarPicker`,component:l,args:{holderOptions:o,initialSelection:null,placeholderOptions:a}},p={name:`未选择`},m={name:`已选择成员`,args:{initialSelection:{id:o[1]?.user_id??``,kind:`member`}}},h={name:`没有待邀请成员`,args:{placeholderOptions:[]}},g={name:`没有可选持有人`,args:{holderOptions:[],placeholderOptions:[]}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "未选择"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "已选择成员",
  args: {
    initialSelection: {
      id: accountHolderOptionsFixture[1]?.user_id ?? "",
      kind: "member"
    }
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "没有待邀请成员",
  args: {
    placeholderOptions: []
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "没有可选持有人",
  args: {
    holderOptions: [],
    placeholderOptions: []
  }
}`,...g.parameters?.docs?.source}}},_=[`Unselected`,`MemberSelected`,`MembersOnly`,`NoOptions`]}))();export{m as MemberSelected,h as MembersOnly,g as NoOptions,p as Unselected,_ as __namedExportsOrder,f as default};
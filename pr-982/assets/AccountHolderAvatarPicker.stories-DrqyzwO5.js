import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,n as a,o,t as s}from"./accountHolders-Bb_kmsPg.js";import{n as c,t as l}from"./AccountHolderAvatarPicker-D_9bWlSI.js";function u({holderOptions:e,initialSelection:t,placeholderOptions:n,preservedHolderOptions:r}){let[i,a]=(0,f.useState)(t);return(0,d.jsx)(l,{holderOptions:e,onChange:a,placeholderOptions:n,preservedHolderOptions:r,selection:i})}var d,f,p,m,h,g,_,v,y;t((()=>{d=r(),f=e(n()),o(),c(),p={title:`Molecules/Accounts/AccountHolderAvatarPicker`,component:u,args:{holderOptions:s,initialSelection:null,placeholderOptions:a}},m={name:`未选择`},h={name:`已选择成员`,args:{initialSelection:{id:s[1]?.user_id??``,kind:`member`}}},g={name:`没有待邀请成员`,args:{placeholderOptions:[]}},_={name:`没有可选持有人`,args:{holderOptions:[],placeholderOptions:[]}},v={name:`编辑时有非活跃成员持有人`,args:{preservedHolderOptions:[i]}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "未选择"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "已选择成员",
  args: {
    initialSelection: {
      id: accountHolderOptionsFixture[1]?.user_id ?? "",
      kind: "member"
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "没有待邀请成员",
  args: {
    placeholderOptions: []
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "没有可选持有人",
  args: {
    holderOptions: [],
    placeholderOptions: []
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑时有非活跃成员持有人",
  args: {
    preservedHolderOptions: [inactiveAccountHolderOptionFixture]
  }
}`,...v.parameters?.docs?.source}}},y=[`Unselected`,`MemberSelected`,`MembersOnly`,`NoOptions`,`WithInactiveHolder`]}))();export{h as MemberSelected,g as MembersOnly,_ as NoOptions,m as Unselected,v as WithInactiveHolder,y as __namedExportsOrder,p as default};
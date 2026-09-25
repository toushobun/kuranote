import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./AccountHolderCheckboxGroup-B9srG9-y.js";var r,i,a,o,s,c,l,u,d,f,p,m,h;e((()=>{t(),r={title:`Molecules/Accounts/AccountHolderCheckboxGroup`,component:n,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}]}},i={name:`默认（无选中）`},a={name:`已选中持有人`,args:{selectedUserIds:[`user-1`]}},o={name:`无可选持有人`,args:{holderOptions:[]}},s={name:`含非活跃持有人`,args:{preservedHolderOptions:[{user_id:`user-3`,display_name:`已离开用户`,email:`left@example.test`}]}},c={name:`仅一位持有人`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],selectedUserIds:[`user-1`]}},l={name:`选中活跃持有人 + 保留非活跃持有人`,args:{selectedUserIds:[`user-1`],preservedHolderOptions:[{user_id:`user-3`,display_name:`已离开用户`,email:`left@example.test`}]}},u=[{placeholder_id:`placeholder-1`,display_name:`奶奶`},{placeholder_id:`placeholder-2`,display_name:`爷爷`}],d={name:`三态：成员 + 待邀请成员（无选中即无持有人）`,args:{placeholderOptions:u}},f={name:`三态：已选中待邀请成员`,args:{placeholderOptions:u,selectedPlaceholderId:`placeholder-1`}},p={name:`三态：只有待邀请成员可选`,args:{holderOptions:[],placeholderOptions:u}},m={name:`三态：移动端`,args:{placeholderOptions:u,selectedPlaceholderId:`placeholder-2`},parameters:{viewport:{defaultViewport:`mobile2`}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "默认（无选中）"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "已选中持有人",
  args: {
    selectedUserIds: ["user-1"]
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "无可选持有人",
  args: {
    holderOptions: []
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "含非活跃持有人",
  args: {
    preservedHolderOptions: [{
      user_id: "user-3",
      display_name: "已离开用户",
      email: "left@example.test"
    }]
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "仅一位持有人",
  args: {
    holderOptions: [{
      user_id: "user-1",
      display_name: "本地开发用户",
      email: "local1@example.test"
    }],
    selectedUserIds: ["user-1"]
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "选中活跃持有人 + 保留非活跃持有人",
  args: {
    selectedUserIds: ["user-1"],
    preservedHolderOptions: [{
      user_id: "user-3",
      display_name: "已离开用户",
      email: "left@example.test"
    }]
  }
}`,...l.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "三态：成员 + 待邀请成员（无选中即无持有人）",
  args: {
    placeholderOptions
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "三态：已选中待邀请成员",
  args: {
    placeholderOptions,
    selectedPlaceholderId: "placeholder-1"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "三态：只有待邀请成员可选",
  args: {
    holderOptions: [],
    placeholderOptions
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "三态：移动端",
  args: {
    placeholderOptions,
    selectedPlaceholderId: "placeholder-2"
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`WithSelected`,`Empty`,`WithPreservedOptions`,`SingleHolder`,`SelectedWithPreserved`,`WithPlaceholderOptions`,`PlaceholderSelected`,`PlaceholderOnly`,`PlaceholderMobile`]}))();export{i as Default,o as Empty,m as PlaceholderMobile,p as PlaceholderOnly,f as PlaceholderSelected,l as SelectedWithPreserved,c as SingleHolder,d as WithPlaceholderOptions,s as WithPreservedOptions,a as WithSelected,h as __namedExportsOrder,r as default};
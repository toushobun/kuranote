import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./DataImportHolderMapping-BrltNsR5.js";var r,i,a,o,s,c,l,u,d,f,p,m;e((()=>{t(),{fn:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o={title:`Organisms/Settings/DataImportHolderMapping`,component:n,args:{candidates:[{name:`小明`,recordCount:12,reason:`unmatched`},{name:`小红`,recordCount:3,reason:`unmatched`},{name:`重名`,recordCount:1,reason:`ambiguous`}],members:[{displayName:`张三`,email:`zhang@example.com`,userId:`user-1`},{displayName:`重名`,email:`a@example.com`,userId:`user-2`},{displayName:`重名`,email:`b@example.com`,userId:`user-3`}],onCancel:r(),onConfirm:r(),placeholders:[]}},s={name:`默认（含歧义姓名）`},c={name:`仅一个未匹配姓名`,args:{candidates:[{name:`小明`,recordCount:1,reason:`unmatched`}]}},l=[{displayName:`奶奶`,id:`00000000-0000-4000-8000-000000000051`},{displayName:`外婆`,id:`00000000-0000-4000-8000-000000000052`}],u={name:`含待邀请成员（非管理员，无新建选项）`,args:{candidates:[{name:`奶奶`,recordCount:5,reason:`unmatched`},{name:`小明`,recordCount:12,reason:`unmatched`}],placeholders:l},play:async({canvasElement:e})=>{await i.click(a(e).getAllByRole(`combobox`)[0])}},d={name:`管理员：可新建待邀请成员（歧义姓名不提供）`,args:{canCreatePlaceholders:!0,placeholders:l},play:async({canvasElement:e})=>{await i.click(a(e).getAllByRole(`combobox`)[0])}},f={name:`管理员：可新建待邀请成员（移动端）`,args:{canCreatePlaceholders:!0,candidates:[{name:`小明`,recordCount:12,reason:`unmatched`},{name:`奶奶`,recordCount:5,reason:`unmatched`},{name:`重名`,recordCount:1,reason:`ambiguous`}],placeholders:l},parameters:{viewport:{defaultViewport:`mobile2`}}},p={name:`禁用`,args:{disabled:!0}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "默认（含歧义姓名）"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "仅一个未匹配姓名",
  args: {
    candidates: [{
      name: "小明",
      recordCount: 1,
      reason: "unmatched"
    }]
  }
}`,...c.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "含待邀请成员（非管理员，无新建选项）",
  args: {
    candidates: [{
      name: "奶奶",
      recordCount: 5,
      reason: "unmatched"
    }, {
      name: "小明",
      recordCount: 12,
      reason: "unmatched"
    }],
    placeholders
  },
  // 展开「奶奶」的下拉：同名待邀请成员排在最前，但不会被自动选中。
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getAllByRole("combobox")[0]);
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "管理员：可新建待邀请成员（歧义姓名不提供）",
  args: {
    canCreatePlaceholders: true,
    placeholders
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getAllByRole("combobox")[0]);
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "管理员：可新建待邀请成员（移动端）",
  args: {
    canCreatePlaceholders: true,
    candidates: [{
      name: "小明",
      recordCount: 12,
      reason: "unmatched"
    }, {
      name: "奶奶",
      recordCount: 5,
      reason: "unmatched"
    }, {
      name: "重名",
      recordCount: 1,
      reason: "ambiguous"
    }],
    placeholders
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "禁用",
  args: {
    disabled: true
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`SingleName`,`WithPlaceholders`,`ManagerCanCreate`,`ManagerCanCreateMobile`,`Disabled`]}))();export{s as Default,p as Disabled,d as ManagerCanCreate,f as ManagerCanCreateMobile,c as SingleName,u as WithPlaceholders,m as __namedExportsOrder,o as default};
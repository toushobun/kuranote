import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n,d as r,i,l as a,s as o}from"./LedgerSetupAbandonButton-COJ4gShY.js";import{n as s,t as c}from"./LedgerSetupWizard-Bx6Dp2wg.js";var l,u,d,f,p,m,h;e((()=>{s(),t(),r(),l=(()=>{let e=a();return{...e,setup:{...e.setup,step:6}}})(),u={pendingInvites:[{createdAt:`2026-10-07T01:00:00.000Z`,id:`invite-1`,placeholderId:`placeholder-1`,role:`member`,token:`a`.repeat(64)}],placeholderMembers:[{displayName:`奶奶`,id:`placeholder-1`},{displayName:`爷爷`,id:`placeholder-2`}]},d={title:`Organisms/Ledgers/LedgerSetupInviteStep`,component:c,decorators:n,args:{actions:i(l),...o,progress:l},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`无待邀请成员`},p={name:`有待邀请成员`,args:{actions:i(l,{inviteMembers:u})}},m={name:`读取失败`,args:{actions:{...i(l),loadInviteMembers:async()=>({error:`邀请成员加载失败，请稍后重试。`})}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "无待邀请成员"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "有待邀请成员",
  args: {
    actions: createLedgerSetupWizardStoryActions(inviteProgress, {
      inviteMembers
    })
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "读取失败",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(inviteProgress),
      loadInviteMembers: async () => ({
        error: "邀请成员加载失败，请稍后重试。"
      })
    }
  }
}`,...m.parameters?.docs?.source}}},h=[`Empty`,`WithPlaceholderMembers`,`LoadFailed`]}))();export{f as Empty,m as LoadFailed,p as WithPlaceholderMembers,h as __namedExportsOrder,d as default};
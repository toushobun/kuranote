import{i as e}from"./preload-helper-D2yxXLVK.js";import{r as t,t as n}from"./ledgerSetup-FkC1q1tT.js";import{a as r,c as i,i as a,n as o,o as s,r as c}from"./ledgerSetupWizardStoryUtils-CT_nifmj.js";var l,u,d,f,p,m,h;e((()=>{i(),c(),t(),l=(()=>{let e=n();return{...e,setup:{...e.setup,step:6}}})(),u={pendingInvites:[{createdAt:`2026-10-07T01:00:00.000Z`,id:`invite-1`,placeholderId:`placeholder-1`,role:`member`,token:`a`.repeat(64)}],placeholderMembers:[{displayName:`奶奶`,id:`placeholder-1`},{displayName:`爷爷`,id:`placeholder-2`}]},d={title:`Organisms/Ledgers/LedgerSetupInviteStep`,component:s,decorators:r,args:{actions:o(l),...a,progress:l},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`无待邀请成员`},p={name:`有待邀请成员`,args:{actions:o(l,{inviteMembers:u})}},m={name:`读取失败`,args:{actions:{...o(l),loadInviteMembers:async()=>({error:`邀请成员加载失败，请稍后重试。`})}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
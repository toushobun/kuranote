-- 用户主题色入库，作为跨设备同步的唯一主数据。
-- 取值必须与 src/internal/user/entity/userProfile.ts 的 userThemeKeys 保持一致。
-- app_user 现有 RLS（app_user_update_self）与表级 UPDATE 授权已覆盖本列，无需新增策略。
alter table public.app_user
add column theme_key text not null
default 'amberWarmth';

alter table public.app_user
add constraint app_user_theme_key_check
check (
    theme_key in (
        'amberWarmth',
        'lavenderDream',
        'emeraldMorning',
        'sakuraStory',
        'deepSeaStarlight',
        'flameRed'
    )
);

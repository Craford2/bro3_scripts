# ブラウザ三国志のオートビルダー（作成中）
主な機能としては、各施設の自動建設およびレベルアップ、自動巡回、および自動内政を保持する予定

既存のビルダーとの相違点は概ね以下のとおり
* 建設条件を満たした施設を空き地に順次建設可能
* 任意の空き地を残して建設計画を設定可能
* 建設計画の事前シミュレートが可能
* 独自建設計画を設定できるようにする予定
* 巡回時間を指定せずに直近で建設が完了した拠点に遷移することで、サーバ負荷を減らし、なるはやの巡回ができるようになる予定
* 建設時間短縮スキルについては、拠点切替時に発動ではなく、次の建設実施時に発動させる予定
* 資源UPスキルについては、必要施設がない（例えば糧がない）ときに、無駄なスキル（例えば石切技術）を発動させないようにする予定
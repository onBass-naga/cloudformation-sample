# cloudformation-sample

このサンプルでは下記のような構成を目指す。

- CloudFront+S3でSPA用の静的リソースを配信 
- Elastic Beanstalk(Docker)でAPI用アプリケーションを起動
- ストレージにはRDS(Aurora)を使用
- 踏み台サーバー経由でRDSと接続


テンプレートはコメントを記述したいので`json`ではなく`yaml`を採用  



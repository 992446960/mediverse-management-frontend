## 链接仓库并命名 

```bash
git remote add hxsy https://gitlab.i.huaxisy.com/innovation-labs/management-frontend.git
```
## 检查
```bash
git remote -v
```

## 当前分支只跟踪 hxsy（首次推送并绑定上游）
```bash
git checkout <你的分支名>
git push -u hxsy HEAD
```
之后在该分支上 git push / git pull 默认走 hxsy。

## 远程尚无同名分支时推当前分支
git push -u hxsy HEAD

## 本地改名后同步远程（可选）

git branch -m <新分支名>
git push -u hxsy HEAD
git push hxsy --delete <旧分支名>

## 合并主仓 main 到当前分支再推 hxsy（主仓远程默认 origin，默认分支为 main 时。）

```bash
git checkout <你的分支名>
git fetch origin
git merge origin/main
# 有冲突：解决后 git add ... && git merge --continue
git push
```

## 查看当前分支与上游

```bash
git branch --show-current
git branch -vv
```
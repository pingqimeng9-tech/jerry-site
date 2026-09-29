# -*- coding: utf-8 -*-
"""
Jerry CMS Python 启动器（对标星辉 Start.bat + launcher.py 的体验）
------------------------------------------------------------------
职责：
  1. 环境自检：Node.js 是否可用（给出友好提示）
  2. 在独立窗口启动本地服务（node server.js，默认 127.0.0.1:5858）
  3. 等待端口就绪后自动打开浏览器（控制台/首页）
  4. 服务进程崩溃时提示并支持自动重启（--watch 模式）
用法：
  python launcher.py            # 标准启动
  python launcher.py --watch    # 服务退出后自动重启（改 server.js 调试用）
  python launcher.py --page editor   # 直接打开编辑器 / settings / content / admin
端口：环境变量 PORT 或 --port 参数，默认 5858
"""
import os
import sys
import time
import socket
import webbrowser
import subprocess
import argparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 5858

PAGES = {
    'home':   '/',
    'blog':   '/blog.html',
    'admin':  '/admin/index.html',
    'editor': '/admin/editor.html?id=new',
    'settings': '/admin/settings.html',
    'content': '/admin/content.html',
    'moments': '/moments.html',
    'timeline': '/timeline.html',
    'friends': '/friends.html',
    'projects': '/projects.html',
    'photowall': '/photowall.html',
}


def find_node():
    """找到 node 可执行文件；找不到返回 None"""
    from shutil import which
    node = which('node')
    if node:
        return node
    # 常见安装位置兜底
    for p in (r'C:\Program Files\nodejs\node.exe',
              r'C:\Program Files (x86)\nodejs\node.exe',
              os.path.expandvars(r'%LOCALAPPDATA%\Programs\nodejs\node.exe'),
              r'D:\Git\node.exe'):
        if os.path.isfile(p):
            return p
    return None


def port_open(port, timeout=0.4):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=timeout):
            return True
    except OSError:
        return False


def wait_port(port, seconds=15):
    deadline = time.time() + seconds
    while time.time() < deadline:
        if port_open(port):
            return True
        time.sleep(0.3)
    return False


def start_server_window(node, port):
    """在新的 cmd 窗口里跑 server.js（关窗即停站，跟旧版体验一致）"""
    if port_open(port):
        print(f'[i] 端口 {port} 已有服务在跑，直接复用（不开新窗口）')
        return None
    env = os.environ.copy()
    env['PORT'] = str(port)
    if os.name == 'nt':
        subprocess.Popen(
            ['cmd', '/k', f'title JerryCMS Server && "{node}" "{os.path.join(ROOT, "server.js")}"'],
            cwd=ROOT, env=env, creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
    else:
        subprocess.Popen([node, 'server.js'], cwd=ROOT, env=env)
    return True


def main():
    ap = argparse.ArgumentParser(description='Jerry CMS launcher')
    ap.add_argument('--port', type=int, default=int(os.environ.get('PORT', DEFAULT_PORT)))
    ap.add_argument('--page', default='home', choices=sorted(PAGES))
    ap.add_argument('--watch', action='store_true', help='服务崩溃后自动重启')
    args = ap.parse_args()

    print('=' * 46)
    print('  Jerry CMS · Python 启动器')
    print(f'  站点     : http://127.0.0.1:{args.port}/')
    print(f'  控制台   : http://127.0.0.1:{args.port}/admin/index.html')
    print(f'  设置     : http://127.0.0.1:{args.port}/admin/settings.html')
    print('=' * 46)

    node = find_node()
    if not node:
        print('[ERROR] 没找到 Node.js。请先安装：https://nodejs.org/')
        if os.name == 'nt':
            os.system('pause')
        sys.exit(1)
    print(f'[1/3] Node.js 就绪：{node}')

    start_server_window(node, args.port)
    print('[2/3] 等待本地服务就绪…')
    if not wait_port(args.port):
        print('[WARN] 服务没有在 15 秒内就绪（第一次启动或端口被占用时会这样），仍尝试打开浏览器')

    print('[3/3] 打开浏览器…')
    url = f'http://127.0.0.1:{args.port}' + PAGES.get(args.page, '/')
    webbrowser.open(url)

    if args.watch:
        print('[watch] 模式开启：服务窗口关闭/崩溃后 2 秒自动重启（Ctrl+C 退出本启动器）')
        try:
            while True:
                time.sleep(2)
                if not port_open(args.port):
                    print('[watch] 服务不在了，重新拉起…')
                    start_server_window(node, args.port)
                    wait_port(args.port, 10)
        except KeyboardInterrupt:
            print('\n[watch] 启动器退出（服务窗口需手动关闭）')
    else:
        print('完成！关闭 "JerryCMS Server" 窗口即停止站点。')
        if os.name == 'nt':
            os.system('pause')


if __name__ == '__main__':
    main()

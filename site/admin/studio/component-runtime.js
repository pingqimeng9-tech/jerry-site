(function () {
  'use strict';
  if (window.JerryComponents) return;

  var registry = new Map();

  function register(def) {
    if (!def || !def.id) throw new Error('component id required');
    registry.set(def.id, Object.assign({ version: '1.0.0', schema: [] }, def));
  }

  function get(id) { return registry.get(id); }
  function list() { return Array.from(registry.values()); }

  function getPath(obj, path) {
    return String(path || '').split('.').reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function setPath(obj, path, value) {
    var keys = String(path || '').split('.');
    var cur = obj;
    keys.forEach(function (key, index) {
      if (index === keys.length - 1) cur[key] = value;
      else {
        if (!cur[key] || typeof cur[key] !== 'object') cur[key] = {};
        cur = cur[key];
      }
    });
  }

  function fieldValue(config, field) {
    var value = getPath(config, field.key);
    return value === undefined || value === null ? (field.default !== undefined ? field.default : '') : value;
  }

  function renderInspector(box, def, config, onChange) {
    box.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'inspector-head';
    head.innerHTML = '<div class="inspector-icon">' + (def.icon || '🧩') + '</div>' +
      '<div><b>' + def.name + '</b><span>' + (def.description || '') + '</span></div>' +
      '<code>v' + (def.version || '1.0.0') + '</code>';
    box.appendChild(head);

    (def.schema || []).forEach(function (field) {
      var row = document.createElement('div');
      row.className = 'cms-field' + (field.type === 'switch' ? ' cms-field-switch' : '');
      row.dataset.field = field.key;
      var label = document.createElement('label');
      label.textContent = field.label || field.key;
      row.appendChild(label);

      var value = fieldValue(config, field);
      var input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows || 4;
        input.value = value;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        (field.options || []).forEach(function (opt) {
          var option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (String(opt.value) === String(value)) option.selected = true;
          input.appendChild(option);
        });
      } else if (field.type === 'switch') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!value;
      } else if (field.type === 'color') {
        input = document.createElement('input');
        input.type = 'color';
        input.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#0e0c22';
      } else if (field.type === 'range') {
        var rangeWrap = document.createElement('div');
        rangeWrap.className = 'cms-range';
        input = document.createElement('input');
        input.type = 'range';
        input.min = field.min != null ? field.min : 0;
        input.max = field.max != null ? field.max : 1;
        input.step = field.step != null ? field.step : 0.01;
        input.value = value;
        var rangeOut = document.createElement('span');
        rangeOut.className = 'cms-range-value';
        rangeOut.textContent = value;
        rangeWrap.appendChild(input);
        rangeWrap.appendChild(rangeOut);
        row.appendChild(rangeWrap);
        input.addEventListener('input', function () {
          rangeOut.textContent = input.value;
          onChange(field.key, Number(input.value));
        });
        box.appendChild(row);
        return;
      } else if (field.type === 'image') {
        var media = document.createElement('div');
        media.className = 'cms-image-field';
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = field.placeholder || '图片 URL，或点击上传';
        input.value = value || '';
        var uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className = 'btn ghost';
        uploadBtn.textContent = '⬆ 上传';
        var picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        picker.hidden = true;
        var preview = document.createElement('div');
        preview.className = 'cms-image-preview';
        preview.textContent = value ? '' : '无图片';
        if (value) preview.style.backgroundImage = 'url("' + String(value).replace(/"/g, '%22') + '")';
        uploadBtn.addEventListener('click', function () { picker.click(); });
        picker.addEventListener('change', async function () {
          var file = picker.files && picker.files[0];
          if (!file) return;
          if (!window.JerryUpload) { alert('上传组件未加载'); return; }
          uploadBtn.disabled = true;
          uploadBtn.textContent = '上传中…';
          try {
            var result = await JerryUpload.uploadFile(file, { dir: 'images/bg' });
            if (!result.ok) throw new Error(result.error || '上传失败');
            input.value = result.url;
            preview.style.backgroundImage = 'url("' + result.url.replace(/"/g, '%22') + '")';
            preview.textContent = '';
            onChange(field.key, result.url);
          } catch (error) {
            alert('上传失败：' + error.message);
          } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '⬆ 上传';
            picker.value = '';
          }
        });
        media.appendChild(input);
        media.appendChild(uploadBtn);
        media.appendChild(picker);
        media.appendChild(preview);
        row.appendChild(media);
        input.addEventListener('input', function () {
          var v = input.value.trim();
          preview.textContent = v ? '' : '无图片';
          preview.style.backgroundImage = v ? 'url("' + v.replace(/"/g, '%22') + '")' : '';
          onChange(field.key, v);
        });
        box.appendChild(row);
        return;
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = field.placeholder || '';
      }

      if (field.type === 'switch') {
        var sw = document.createElement('span');
        sw.className = 'cms-switch';
        sw.appendChild(input);
        row.appendChild(sw);
        input.addEventListener('change', function () { onChange(field.key, input.checked); });
      } else {
        row.appendChild(input);
        var eventName = (field.type === 'select' || field.type === 'color') ? 'change' : 'input';
        input.addEventListener(eventName, function () { onChange(field.key, input.value); });
      }
      box.appendChild(row);
    });
  }

  window.JerryComponents = {
    register: register,
    get: get,
    list: list,
    renderInspector: renderInspector,
    getPath: getPath,
    setPath: setPath
  };
})();

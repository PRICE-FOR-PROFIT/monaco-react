import React from 'react';
import PropTypes from 'prop-types';
import Editor from '..';
import { noop } from '../utils';
import useThrottleFn from 'react-use/lib/useThrottleFn';

const editorLineHeightInPx = 20;

const getEditorHeight = (editor) => {
  const lineCount = editor.getModel()?.getLineCount() || 1;
  return editor.getTopForLineNumber(lineCount + 1) + editorLineHeightInPx;
};

const placeholderText = '// Calculation goes here';

const placeholderWidget = {
  getId: function() {
    return 'my.content.widget';
  },
  allowEditorOverflow: false,
  suppressMouseDown: false,
  getDomNode: function() {
    const placeholderDomElement = document.createElement('span');
    placeholderDomElement.innerHTML = placeholderText;
    placeholderDomElement.style.width = '500px';
    placeholderDomElement.style.pointerEvents = 'none';
    placeholderDomElement.style.opacity = '50%';
    return placeholderDomElement;
  },
  getPosition: function() {
    return {
      position: {
        lineNumber: 0,
        column: 0,
      },
      range: {
        startColumn: 0,
        startLineNumber: 0,
        endColumn: 25,
        endLineNumber: 0,
      },
      preference: [
        0,
        1,
      ],
    };
  },
};

const ControlledEditor = ({ value, onChange, editorDidMount, ...props }) => {
  const [valueState, setValueState] = React.useState(props.value);
  const [editor, setEditor] = React.useState();
  const [editorHeight, setEditorHeight] = React.useState(editorLineHeightInPx);

  const updateEditorHeight = React.useCallback(() => {
    if (!editor) return;
    const height = getEditorHeight(editor);

    if (height !== editorHeight) {
      // setEditorHeight(height);
      // requestAnimationFrame(() => {
      // editor.layout();
      // });

      // the comment above also seemed to work. keeping it as something to try if a bug is found
      requestAnimationFrame(() => {
        setEditorHeight(height);
        editor.layout();
      });
    }
  }, [editor, editorHeight]);

  const updatePlaceHolder = React.useCallback(() => {
    if (typeof editor === 'undefined') return;

    const editorValue = editor.getValue();
    const hasFocus = editor.hasTextFocus() || editor.hasWidgetFocus();
    if (editorValue.length > 0 || hasFocus) {
      editor.removeContentWidget(placeholderWidget);
    } else {
      editor.addContentWidget(placeholderWidget);
    }
  }, [editor]);

  const onChangeCallback = React.useCallback(() => {
    if (!editor) return;
    const editorValue = editor.getValue();
    if (editorValue !== valueState) {
      setValueState(editorValue);
    }
  }, [editor, valueState]);

  useThrottleFn(
    (throttledValue) => {
      if (!editor) return;
      onChange(valueState);
    },
    200,
    [valueState]
  );

  const editorDidMountCallback = React.useCallback((getEditorValue, monacoEditorInstance) => {
    setEditor(monacoEditorInstance);
  }, []);

  React.useEffect(() => {
    updateEditorHeight();
  });

  React.useEffect(() => {
    if (!editor) return;
    const disposable = editor.onDidChangeModelContent(onChangeCallback);

    return () => {
      if (typeof disposable !== 'undefined') {
        disposable.dispose();
      }
    };
  }, [editor, onChangeCallback]);

  React.useEffect(() => {
    if (!editor) return;
    updatePlaceHolder();
    const disposable1 = editor.onDidFocusEditorText(updatePlaceHolder);
    const disposable2 = editor.onDidFocusEditorWidget(updatePlaceHolder);
    const disposable3 = editor.onDidBlurEditorText(updatePlaceHolder);
    const disposable4 = editor.onDidBlurEditorWidget(updatePlaceHolder);

    return () => {
      if (typeof disposable1 !== 'undefined') disposable1.dispose();
      if (typeof disposable2 !== 'undefined') disposable2.dispose();
      if (typeof disposable3 !== 'undefined') disposable3.dispose();
      if (typeof disposable4 !== 'undefined') disposable4.dispose();
    };
  }, [editor, updatePlaceHolder]);

  React.useEffect(() => {
    if (!editor) return;
    const disposable = editor.onDidFocusEditorText(onChangeCallback);

    return () => {
      if (typeof disposable !== 'undefined') {
        disposable.dispose();
      }
    };
  }, [editor, onChangeCallback]);

  React.useEffect(() => {
    if (typeof editor !== 'undefined') {
      const model = editor.getModel();
      if (model !== null) return () => model.dispose();
    }
  }, [editor]);

  return <Editor
    value={value}
    editorDidMount={editorDidMountCallback}
    _isControlledMode={true}
    {...props}
  />
};

ControlledEditor.propTypes = {
  value: PropTypes.string,
  editorDidMount: PropTypes.func,
  onChange: PropTypes.func,
};

ControlledEditor.defaultProps = {
  editorDidMount: noop,
  onChange: noop,
};

export default ControlledEditor;

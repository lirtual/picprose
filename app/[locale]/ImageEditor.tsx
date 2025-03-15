"use client";
import React from "react";
import "./devicon.min.css";
import {
  Spinner,
} from "@nextui-org/react";
import { usePicprose } from "./PicproseContext";

// 添加Props类型定义
interface ImageEditorProps {
  isDragMode: boolean;
  elements: {
    title: { x: number; y: number; visible: boolean };
    author: { x: number; y: number; visible: boolean };
    icon: { x: number; y: number; visible: boolean };
    image: { x: number; y: number };
  };
  setElements: React.Dispatch<React.SetStateAction<{
    title: { x: number; y: number; visible: boolean };
    author: { x: number; y: number; visible: boolean };
    icon: { x: number; y: number; visible: boolean };
    image: { x: number; y: number };
  }>>;
  saveHistory: (elements: any) => void;
}

export const ImageEditor = ({ 
  isDragMode, 
  elements, 
  setElements,
  saveHistory
}: ImageEditorProps) => {
  const { propertyInfo, imageInfo } = usePicprose();
  const [isLoading, setIsLoading] = React.useState(false);
  const [imagePosition, setImagePosition] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartY, setDragStartY] = React.useState(0);
  const [imageHorizontalPosition, setImageHorizontalPosition] = React.useState(0);
  const imageRef = React.useRef<HTMLImageElement>(null);
  
  // 拖动状态
  const [draggingElement, setDraggingElement] = React.useState<string | null>(null);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  
  // 添加拖动边界检测
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // 直接从Context获取所有属性
  const {
    aspect,
    blur,
    blurTrans,
    title,
    subTitle,
    author,
    icon,
    devicon,
    font,
    fontSizeValue,
    authorFontSizeValue,
    color,
    logoPosition,
  } = propertyInfo;

  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    if(imageInfo.url) {
      setIsLoading(true);
    }
  }, [imageInfo.url]);

  // 使用useCallback优化事件处理函数
  const handleImageMouseDown = React.useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    console.log("图片收到点击事件");
    if (!isDragMode) return;
    setIsDragging(true);
    setDragStartY(e.clientY - imagePosition);
    // 不再需要记录水平方向的起始位置
    setDragStart({ 
      x: e.clientX, // 仍然需要记录x，因为其他元素可能需要
      y: e.clientY - imagePosition 
    });
    e.stopPropagation();
  }, [isDragMode, imagePosition]);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && imageRef.current) {
      console.log("拖动中...", e.clientY);
      const newVerticalPosition = e.clientY - dragStartY;
      
      const container = containerRef.current;
      const image = imageRef.current;
      
      if (container && image) {
        const containerRect = container.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        
        // 确保图片可以在容器内移动的范围
        // 如果图片高度小于容器，则不限制上下移动
        const imageHeight = imageRect.height;
        const containerHeight = containerRect.height;
        
        console.log("尺寸:", {imageHeight, containerHeight});
        
        let minY, maxY;
        if (imageHeight <= containerHeight) {
          // 如果图片小于容器，允许少量移动以测试
          minY = -50;
          maxY = 50;
        } else {
          // 图片大于容器时的正常计算
          minY = containerHeight - imageHeight;
          maxY = 0;
        }
        
        const boundedY = Math.max(minY, Math.min(maxY, newVerticalPosition));
        console.log("边界计算:", {minY, maxY, newPosition: newVerticalPosition, bounded: boundedY});
        
        setImagePosition(boundedY);
        forceUpdate();
      } else {
        setImagePosition(newVerticalPosition);
      }
    }
    
    // 处理其他元素拖动
    if (draggingElement && isDragMode) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      if (draggingElement === 'title' || draggingElement === 'author' || 
          draggingElement === 'icon' || draggingElement === 'image') {
        handleElementDragImpl(draggingElement, deltaX, deltaY);
      }
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging || draggingElement) {
      saveHistory(elements); // 保存操作历史
    }
    setIsDragging(false);
    setDraggingElement(null);
  };

  // 元素拖动开始处理
  const handleElementDragStart = (element: string, e: React.MouseEvent) => {
    if (!isDragMode) return;
    e.stopPropagation();
    setDraggingElement(element);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    if (isDragging || draggingElement) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartY, draggingElement, dragStart, isDragMode]);

  // 修复TypeScript错误的元素拖动处理函数
  const handleElementDragImpl = (elementKey: 'title' | 'author' | 'icon' | 'image', deltaX: number, deltaY: number) => {
    setElements(prev => {
      const newElements = {...prev};
      if (elementKey === 'title') {
        newElements.title = {
          ...newElements.title,
          x: newElements.title.x + deltaX,
          y: newElements.title.y + deltaY
        };
      } else if (elementKey === 'author') {
        newElements.author = {
          ...newElements.author,
          x: newElements.author.x + deltaX,
          y: newElements.author.y + deltaY
        };
      } else if (elementKey === 'icon') {
        newElements.icon = {
          ...newElements.icon,
          x: newElements.icon.x + deltaX,
          y: newElements.icon.y + deltaY
        };
      } else if (elementKey === 'image') {
        newElements.image = {
          ...newElements.image,
          x: newElements.image.x + deltaX,
          y: newElements.image.y + deltaY
        };
      }
      return newElements;
    });
  };

  const renderIcon = () => {
    if (devicon.length !== 0) {
      return (
        <div 
          className={`m-4 items-center justify-center flex ${isDragMode ? 'cursor-move' : ''}`}
          onMouseDown={(e) => handleElementDragStart('icon', e)}
        >
          <i className={`devicon-${devicon} text-white dev-icon text-4xl`}></i>
        </div>
      );
    } else if (icon.length > 0) {
      return (
        <div 
          className={`${isDragMode ? 'cursor-move' : ''}`}
          onMouseDown={(e) => handleElementDragStart('icon', e)}
        >
          <img
            src={icon}
            alt="img"
            className="w-12 h-12 m-2 rounded-full"
          />
        </div>
      );
    } else {
      return "";
    }
  };

  // 添加一个处理容器级别鼠标事件的函数
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragMode) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const isClickOnDraggableElement = e.target !== containerRef.current;
      
      if (!isClickOnDraggableElement) {
        // 触发图片拖动逻辑，但只考虑垂直方向
        setIsDragging(true);
        setDragStartY(e.clientY - imagePosition);
        setDragStart({ 
          x: e.clientX, // 仍然记录x坐标用于其他元素
          y: e.clientY - imagePosition 
        });
      }
    }
  };

  // 在渲染函数中添加
  console.log("渲染时的图片位置:", imagePosition);

  return (
    <div className="max-h-screen relative flex group rounded-3xl">
      <div
        ref={containerRef}
        style={{ 
          maxHeight: "90vh", 
          minHeight: "50vh",
          overflow: "hidden", 
          position: "relative",
          pointerEvents: "auto"
        }}
        className={aspect == "" ? "aspect-[16/9]" : aspect}
        onMouseDown={isDragMode ? handleContainerMouseDown : undefined}
      >
        <img
          ref={imageRef}
          src={imageInfo.url}
          alt="Image"
          className={`rounded-md w-full ${isDragMode ? 'cursor-move' : ''}`}
          style={{ 
            position: 'absolute',
            top: `${imagePosition}px`, // 使用绝对定位替代transform
            left: 0,
            width: '100%',
            height: 'auto', // 允许图片保持原始宽高比
            objectFit: 'cover',
            transition: isDragging ? 'none' : 'top 0.1s ease-out',
          }}
          onLoad={() => setIsLoading(false)}
          onMouseDown={handleImageMouseDown}
          draggable={false}
        />

        {/* 网格辅助线 */}
        {isDragMode && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/10"></div>
            ))}
          </div>
        )}
        
        {/* 拖动模式提示 */}
        {isDragMode && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 text-black px-4 py-2 rounded-lg">
              拖动模式：可拖动图片、标题、作者和图标
            </div>
          </div>
        )}
      </div>

      {/* 内容覆盖层 */}
      <div
        style={{
          backgroundColor: color == "" ? "#1F293799" : color + blurTrans,
          pointerEvents: isDragMode ? 'none' : 'auto',
          zIndex: 1
        }}
        className={"absolute top-0 right-0 left-0 rounded-md h-full " + blur}
      >
        {/* 使用统一的绝对定位容器 - 修改这里的pointerEvents逻辑 */}
        <div className="absolute inset-0" style={{ 
          pointerEvents: isDragMode ? 'none' : 'none',
          // 只有元素本身需要拦截事件，不要让容器拦截所有事件
        }}>
          {/* 然后在各个可拖动元素上单独设置pointerEvents */}
          <div 
            className={`absolute ${isDragMode ? 'cursor-move border border-dashed border-white/30' : ''}`}
            style={{ 
              left: '50%',
              top: '40%',
              transform: `translate(-50%, -50%) translate(${elements.title.x}px, ${elements.title.y}px)`,
              transition: draggingElement === 'title' ? 'none' : 'transform 0.1s ease-out',
              padding: isDragMode ? '8px' : '0',
              pointerEvents: isDragMode ? 'auto' : 'none', // 只有在拖动模式时才拦截事件
            }}
            onMouseDown={(e) => handleElementDragStart('title', e)}
          >
            <h1
              className={`leading-tight text-center text-5xl font-bold text-white ${font}`}
              style={{ fontSize: `${fontSizeValue}px` }}
            >
              {title}
            </h1>
          </div>
          
          {/* 作者元素 */}
          <div 
            className={`absolute ${isDragMode ? 'cursor-move border border-dashed border-white/30' : ''}`}
            style={{ 
              left: '50%',
              top: '60%',
              transform: `translate(-50%, -50%) translate(${elements.author.x}px, ${elements.author.y}px)`,
              transition: draggingElement === 'author' ? 'none' : 'transform 0.1s ease-out',
              padding: isDragMode ? '8px' : '0',
              pointerEvents: isDragMode ? 'auto' : 'none', // 只有在拖动模式时才拦截事件
            }}
            onMouseDown={(e) => handleElementDragStart('author', e)}
          >
            <h2
              className={`text-xl font-semibold text-center text-white ${font}`}
              style={{ fontSize: `${authorFontSizeValue}px` }}
            >
              {author}
            </h2>
          </div>
          
          {/* 图标容器 */}
          <div 
            className={`absolute ${isDragMode ? 'cursor-move border border-dashed border-white/30' : ''}`}
            style={{ 
              left: logoPosition === "default" ? '50%' : '0',
              top: logoPosition === "default" ? '70%' : '0',
              transform: `translate(${logoPosition === "default" ? '-50%, -50%' : '0, 0'}) translate(${elements.icon.x}px, ${elements.icon.y}px)`,
              transition: draggingElement === 'icon' ? 'none' : 'transform 0.1s ease-out',
              padding: isDragMode ? '8px' : '0',
              pointerEvents: isDragMode ? 'auto' : 'none', // 只有在拖动模式时才拦截事件
            }}
            onMouseDown={(e) => handleElementDragStart('icon', e)}
          >
            {renderIcon()}
          </div>
        </div>

        {isLoading && <Spinner className={"absolute bottom-8 left-8"} />}
      </div>

      <div className="absolute  bottom-4 right-4 opacity-80">
        <div className=" group-hover:flex hidden items-center">
          <span className="text-sm text-white mx-2">Photo by</span>
          <a
            href={imageInfo.profile}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer flex items-center bg-gray-300 rounded-full text-sm"
          >
            <img
              src={imageInfo.avatar}
              alt={imageInfo.name}
              className="h-6 w-6 rounded-full mr-2"
            />
            <span className="pr-2">{imageInfo.name}</span>
          </a>

          <a
            href="https://unsplash.com/?utm_source=PicProse&utm_medium=referral"
            target="_blank"
            className="text-sm text-white mx-2"
          >
            Unsplash
          </a>
        </div>
      </div>
    </div>
  );
};

// 添加类型定义以支持window对象扩展
declare global {
  interface Window {
    ImageEditorState?: {
      isDragMode: boolean;
      setIsDragMode: (value: boolean) => void;
      handleResetLayout: () => void;
      history: any[];
      historyIndex: number;
      setElements: (elements: any) => void;
      setHistoryIndex: (index: number) => void;
      saveHistory: () => void;
    };
  }
}
